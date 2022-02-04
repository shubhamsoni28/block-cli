var marked = require('marked');
var TerminalRenderer = require('marked-terminal');

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
});

module.exports.openSourceGuideline = async (args) => {
  const text = "# Dcoder-community-blocks\nAn open source program to contribute to Dcoder blocks, now anyone and everyone can take part in this open soruce revolution to help coding community by building blocks for Dcoder\'s low code editor.\n\n## Block\nA block is a piece of code can be described as an action for example: Sending a message on Slack, Adding a row in Google sheets, deploying a website on netlify or fetching data from mongodb abstrated with it\'s title, description, inputs parameters and output. \n\n## Flow\nDcoder is a mobile first low code editor, you can connect the dcoder blocks together to build flows, automations and Dashboards with ui widgets.\n\n\nTo know more about blocks and how to create one follow the link below.\n\n[Block creation process](\"https://www.youtube.com/watch?v=zk24jlyDMb8\")\n\nTo work with blocks on desktop, use our cli with your favorite editor.\n[Click here to access dcoder-cli](https://www.npmjs.com/package/@dcodermobile/dcoder-cli)\n\n## Contribution guidelines\nSee our Contribution guidelines to learn more about how to create and test out a block and contribute to this repo.\n[Click to access Contribution Guidelines](https://github.com/dcodermobile/Dcoder-community-blocks/blob/main/CONTRIBUTING.md)\n\n\n[To get access to Dcoder\'s low code apply here.](https://bit.ly/3CZqU2a)\n"
  console.log(marked(text))
}

module.exports.contributionGuideline = async (args) => {
  const text = "# Contributing guidelines\n\n## Before contributing\n\nWelcome to [dcodermobile/Dcoder-community-blocks](https://github.com/dcodermobile/Dcoder-community-blocks)! Before sending your pull requests,\nmake sure that you *read the whole guidelines*. If you have any doubt on the contributing guide, please feel free to\n[state it clearly in an issue](https://github.com/dcodermobile/Dcoder-community-blocks/issues/new).\n\n## Contribution\n\n### Process\n- Make a fork of this repo in your account.\n- Add a folder to add a new block inside the repo, you can create a block for any application or apis available. You can use this list for [ideas](https://github.com/dcodermobile/Dcoder-community-blocks/blob/main/Roadmap.md) on apps to create block.\n- Use [dcoder-cli](https://www.npmjs.com/package/@dcodermobile/dcoder-cli) to initialise a Dcoder block with base template, login from cli and run `dcoder-cli block init`\n- At the moment editing exiting blocks is not allowed, you can create new blocks, test them and then raise a PR, only original creators should do a PR for exisitng block.\n- Once block code is generated, make the changes in index.js, take input parameters using inputs.paramName and declare those params in dcoder_block.yml\n- You can use cli `dcoder-cli block authentication:add` to add a supported oauth and you can `console.log(auths)` in code to see your authentication token, which you\'ll need to make the api call.\n  For details on other oauth operations and commands use `dcoder-cli -h`, `dcoder-cli block -h` or refer npm guide for [dcoder-cli](https://www.npmjs.com/package/@dcodermobile/dcoder-cli)\n- You can test run your block with `dcoder-cli block run`\n- Once the block runs as expected  create a build by running a command `dcoder-cli block run-command:run` and selecting `@vercel/ncc build`, this will let you run commands defined in dcoder_run.yml\n- The build is created using `@vercel/ncc build` command, change the index.js to dist/index.js in filePath in dcoder_block.yml file.\n- Turn off auto install of npm modules with `dcoder-cli block update-info --auto-install-package false` as we are using a compiled single file in dist folder.\n- Add title, description and tags for your block with ```dcoder-cli block update-info --title \"Your title here\" --description \"This is block description\" --tags \"tag1,tag2,tag3\"```\n- Add the readme for block using `dcoder-cli block readme`\n- Give it a retest, once everything work as expected, create a version with `dcoder-cli block version:create` and enter 1.0.0 as version, we follow semantic versioning.\n- Publish the block with `dcoder-cli block publish`\n- After publishing generate a PR on original repo.\n\n\n### Rules\n\n#### File Naming Convention\n- filenames should use the UpperCamelCase (PascalCase) style.\n- There should be no spaces in filenames.\n- Example:UserProfile.js is allowed but userprofile.js,Userprofile.js,user-Profile.js,userProfile.js are not.\n\n#### Block/Folder Naming Convention\n- Block should use the UpperCamelCase (PascalCase) style.\n- There should be no spaces in blocknames.\n- Example:SlackSendMessage is allowed but slackSendMessage,slacksendmessage,Slack-send-message, slack_send_message are not.\n\n\n#### Main file in block\n- Name of the main file should always be index.js\n\n#### Main function name & signature\n- Name and signature of the main function must be main(inputs, auths, event) in index.js\n\n#### Auto-Install\n- Auto install feature must be turned off and a \'@vercel/ncc build\' generated build file should be used, this allows a faster run of flows as flows do not need to find and install modules at runtime.\n\n#### Path for main file\n- The path for block\'s main file must be `dist/index.js` in dcoder_block.yml"
  console.log(marked(text));
}