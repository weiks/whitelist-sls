"use strict";
const Web3 = require("web3");
const WhiteListController = require("./contracts/WhiteListController");

//All variable will be pulled from env once deployed sls
const transferController = process.env.controllerAddress;
const publicAddress = process.env.publicAddress;
const privateKey = process.env.privateKey;

const RPCURL_BSC_MAINNET = "https://bsc-dataseed.binance.org/";

const web3 = new Web3(RPCURL_BSC_MAINNET);

const controller = new web3.eth.Contract(
  WhiteListController.abi,
  transferController
).methods;

module.exports.whitelist = async (event) => {
  console.log(event);
  if (!event.hasOwnProperty("queryStringParameters")) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid address Provided",
      }),
    };
  }
  const address = event.queryStringParameters.address;
  console.log(address);
  if (!web3.utils.isAddress(address)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Invalid address Provided",
      }),
    };
  }

  const isWhitelisted = await controller.isWhiteListed(address).call();
  console.log(isWhitelisted);
  if (isWhitelisted) {
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Address Already Whitelisted",
        },
        null,
        2
      ),
    };
  }

  let data = controller.addOrChangeUserStatus(address, true).encodeABI();

  const signedTransaction = await web3.eth.accounts.signTransaction(
    {
      from: publicAddress,
      to: transferController,
      data,
      gas: "53484",
    },
    privateKey
  );

  try {
    const { transactionHash } = await web3.eth.sendSignedTransaction(
      signedTransaction.rawTransaction
    );
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Address Whitelisted Successfully",
          transactionHash,
        },
        null,
        2
      ),
    };
  } catch (err) {
    console.log(err);

    return {
      statusCode: 503,
      body: JSON.stringify(
        {
          message: "Something Went Wrong. Please Contact To Customer Care",
        },
        null,
        2
      ),
    };
  }
};
