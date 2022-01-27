const axios = require('axios')
const { BLOCK_API_URL, BLOCK_WS_URL, SYNC_IGNORE_PATH } = require('../configs/config')
const WebSocketClient = require('websocket').client
const path = require('path')
const fs = require('fs')
const pad = require('pad')
const inquirer = require('inquirer')
const colors = require('colors')
let WS_CONNECTION_STATE = {
  CONNECTING: 1,
  CONNECTED: 2,
  DISCONNECTED: 3
}


const FormData = require('form-data'); // npm install --save form-data

let wsState = WS_CONNECTION_STATE.DISCONNECTED

module.exports.createBlock = async (body, token) => {
  const createRes = await axios.post(`${BLOCK_API_URL}/block/create`, body, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
  if (createRes && createRes.data) {
    return createRes.data
  }
  throw new Error('Unable to create block.')
}

module.exports.getBlockData = async (fileId, token) => {
  const blockData = await axios.post(`${BLOCK_API_URL}/project/get2`, {
    project_id: fileId,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
  return blockData.data
}

module.exports.setBlockActiveDevice = async (fileId, deviceId, token) => {
  return axios.post(`${BLOCK_API_URL}/project/setactivedevice`, {
    project_id: fileId,
    device_id: deviceId,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token,
      'Content-Type': 'application/json'
    }
  })
}

module.exports.uploadBlockFile = (blockId, dirPath, localFilePath, token) => {
  const form = new FormData()
  form.append('file', fs.createReadStream(localFilePath))

  const request_config = {
    headers: {
      'x-access-token': token,
      ...form.getHeaders()
    },
    params: {
      project_id: blockId,
      dir_path: dirPath,
      is_from_filesystem: true
    }
  }

  return axios.post(`${BLOCK_API_URL}/file/upload`, form, request_config)
}

module.exports.blockDirOperation = async (blockId, dirPath, operation, token) => {
  const res = await axios.post(`${BLOCK_API_URL}/directory/${operation}`, {
    project_id: blockId,
    dir_path: dirPath,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token
    }
  })
  return res.data.data
}

module.exports.blockFileOperation = async (blockId, filePath, operation, token) => {
  const res = await axios.post(`${BLOCK_API_URL}/file/${operation}`, {
    project_id: blockId,
    file_path: filePath,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token
    }
  })
  return res.data.data
}


const saveBlockFile = async (blockId, filePath, filePatch, token) => {
  const res = axios.post(`${BLOCK_API_URL}/file/get`, {
    project_id: blockId,
    file_path: filePath,
    file_patch: filePatch,
    is_from_filesystem: true
  }, {
    headers: {
      'x-access-token': token
    }
  })
  return res.data
}

module.exports.pullChanges = async (blockId, blockPath, basePath, token, isFile) => {
  if (isFile) {
    const fileData = await this.blockFileOperation(blockId, basePath, 'get', token)
    fs.mkdirSync(path.dirname(path.join(blockPath, basePath)), { recursive: true })
    fs.writeFileSync(path.join(blockPath, basePath), fileData, { encoding: 'utf8' })
  } else {
    const dirData = await this.blockDirOperation(blockId, basePath, 'get', token)
    fs.mkdirSync(path.join(blockPath, basePath), { recursive: true })
    for (let i = 0; i < dirData.length; i++) {
      if (dirData[i].type === 0) {
        const fileData = await this.blockFileOperation(blockId, dirData[i].path, 'get', token)
        fs.mkdirSync(path.dirname(path.join(blockPath, dirData[i].path)), { recursive: true })
        fs.writeFileSync(path.join(blockPath, dirData[i].path), fileData, { encoding: 'utf8' })
      } else if (dirData[i].type === 1) {
        await this.pullChanges(blockId, blockPath, dirData[i].path, token)
      }
    }
  }
}

module.exports.pushChanges = async (blockId, blockPath, basePath, token) => {
  const dirData = await this.blockDirOperation(blockId, basePath, 'get', token)
  let fileList = []
  let dirList = []

  dirData.forEach(d => {
    if (d.type === 0) {
      fileList.push(d.name)
    } else {
      dirList.push(d.name)
    }
  });

  const localDirData = fs.readdirSync(path.join(blockPath, basePath))
  for (let i = 0; i < localDirData.length; i++) {
    const stat = fs.statSync(path.join(blockPath, basePath, localDirData[i]))
    if (stat.isDirectory()) {
      if (dirList.includes(localDirData[i])) {
        dirList.splice(dirList.indexOf(localDirData[i]), 1)
      } else {
        await this.blockDirOperation(blockId, path.join(blockPath, localDirData[i]), 'create', token)
      }

      await this.pushChanges(blockId, blockPath, path.join(basePath, localDirData[i]), token)
    } else if (stat.isFile()) {
      if (fileList.includes(localDirData[i])) {
        fileList.splice(fileList.indexOf(localDirData[i]), 1)
      }
      await this.uploadBlockFile(blockId, basePath, path.join(blockPath, basePath, localDirData[i]), token)
    }
  }

  for (let i = 0; i < fileList.length; i++) {
    if (!(SYNC_IGNORE_PATH.includes(path.join(basePath, fileList[i])))) {
      await this.blockFileOperation(blockId, path.join(basePath, fileList[i]), 'delete', token)
    }
  }

  for (let i = 0; i < dirList.length; i++) {
    if (!(SYNC_IGNORE_PATH.includes(path.join(basePath, dirList[i])))) {
      await this.blockDirOperation(blockId, path.join(basePath, dirList[i]), 'delete', token)
    }
  }
}

const compareChanges = async (blockId, blockPath, basePath, token) => {
  const dirData = await this.blockDirOperation(blockId, basePath, 'get', token)
  let fileList = []
  let dirList = []

  dirData.forEach(d => {
    if (d.type === 0) {
      fileList.push(d.name)
    } else {
      dirList.push(d.name)
    }
  });

  const localDirData = fs.readdirSync(path.join(basePath, basePath))
  for (let i = 0; i < localDirData.length; i++) {
    const stat = fs.statSync(path.join(basePath, basePath, localDirData[i]))
    if (stat.isDirectory()) {
      if (dirList.includes(localDirData[i])) {
        dirList.splice(dirList.indexOf(localDirData[i]), 1)
        await compareChanges(blockId, blockPath, path.join(basePath, localDirData[i]), token)
      } else {
        const { shouldKeep } = await inquirer.prompt([{ name: 'shouldKeep', message: `Directory ${path.join(basePath, localDirData[i])} exist on local but not on server, do want to keep this directory?`, type: 'confirm' }])
        if (shouldKeep) {
          await this.blockDirOperation(blockId, path.join(basePath, localDirData[i]), 'create', token)
          await compareChanges(blockId, blockPath, path.join(basePath, localDirData[i]), token)
        } else {
          fs.rmSync(path.join(basePath, localDirData[i]), { recursive: true })
        }
      }
    } else if (stat.isFile()) {
      if (fileList.includes(localDirData[i])) {
        const localContent = fs.readFileSync(path.join(basePath, basePath, localDirData[i]), { encoding: 'utf8' })
        const cloudContent = await this.blockFileOperation(blockId, path.join(basePath, localDirData[i]), 'get', token)
        fileList.splice(fileList.indexOf(localDirData[i]), 1)
        if (localContent !== cloudContent) {
          const { shouldCreate } = await inquirer.prompt([{ name: 'shouldCreate', message: `File ${path.join(basePath, localDirData[i])} has different content on server, do want to push this local change? \nLocal Content\n${localContent} \nCloud Content\n ${cloudContent}`, type: 'confirm' }])
          if (shouldCreate) {
            fileList.splice(fileList.indexOf(localDirData[i]), 1)
            await this.uploadBlockFile(blockId, basePath, path.join(basePath, basePath, localDirData[i]), token)
          } else {
            fs.writeFileSync(path.join(basePath, basePath, localDirData[i]), cloudContent, { encoding: 'utf8' })
          }
        }
      } else {
        const { shouldKeep } = await inquirer.prompt([{ name: 'shouldKeep', message: `File ${path.join(basePath, localDirData[i])} exist on local but not on server, do want to keep this file?`, type: 'confirm' }])
        if (shouldKeep) {
          await this.uploadBlockFile(blockId, basePath, path.join(basePath, basePath, localDirData[i]), token)
        } else {
          fs.rmSync(path.join(basePath, basePath, localDirData[i]), { recursive: true })
        }
      }
    }
  }

  for (let i = 0; i < fileList.length; i++) {
    const { shouldKeep } = await inquirer.prompt([{ name: 'shouldKeep', message: `File ${path.join(basePath, fileList[i])} not exist on local but exist on server, do want to keep this file?`, type: 'confirm' }])
    if (shouldKeep) {
      await this.pullChanges(blockId, blockPath, path.join(basePath, fileList[i]), token, true)
    } else {
      await this.blockFileOperation(blockId, path.join(basePath, fileList[i]), 'delete', token)
    }
  }

  for (let i = 0; i < dirList.length; i++) {
    const { shouldKeep } = await inquirer.prompt([{ name: 'shouldKeep', message: `Directory ${path.join(basePath, dirList[i])} not exist on local but exist on server, do want to keep this file?`, type: 'confirm' }])
    if (shouldKeep) {
      await this.pullChanges(blockId, blockPath, path.join(basePath, dirList[i]), token)
    } else {
      await this.blockDirOperation(blockId, path.join(basePath, dirList[i]), 'delete', token)
    }
  }
}

module.exports.syncChanges = async (blockId, blockPath, token, syncBack) => {
  if (syncBack) {
    await compareChanges(blockId, blockPath, '', token)
  } else {
    await this.pushChanges(blockId, blockPath, '', token)
  }
}

module.exports.initializeBlock = (projectId, deviceId, token, options) => {
  return new Promise((resolve, reject) => {
    wsState = WS_CONNECTION_STATE.CONNECTING

    const client = new WebSocketClient()

    client.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString())
    })

    client.on('connect', function (connection) {
      connection.on('error', function (error) {
        connection.close()
        wsState = WS_CONNECTION_STATE.DISCONNECTED
      })
      connection.on('close', function () {
        wsState = WS_CONNECTION_STATE.DISCONNECTED
      })
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          const data = JSON.parse(message.utf8Data)

          if (data.type === 9 && data.success) {
            wsState = WS_CONNECTION_STATE.CONNECTED
            resolve(connection)
          }
          if (data.type === 14) {
            connection.send(JSON.stringify({
              type: 15
            }))
          }
          if (data.type === 26) {
            console.log('\n')
            console.log('INPUTS')
            console.log('------------------')
            Object.keys(data.inputs).forEach(key => {
              console.log(pad(colors.grey(key), 30), data.inputs[key])
            })
            console.log('\n')
            console.log('OUTPUT')
            console.log('------------------')
            Object.keys(data.output).forEach(key => {
              console.log(pad(colors.grey(key), 30), data.output[key])
            })
            connection.close()
          }
        }
      })
    })

    client.connect(`${BLOCK_WS_URL}/compiler/?token=${token}&id=${projectId}&fs=${true}&type=1x&did=${deviceId}`, 'echo-protocol');
  })
}

module.exports.closeConnection = (connection) => {
  if (connection) {
    connection.close()
  }
}

module.exports.sendRunEvent = (block, inputs, connection) => {
  const data = {
    type: 24,
    block,
    inputs
  }
  connection.send(JSON.stringify(data))
}
