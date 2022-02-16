'use strict';

const Caver = require('caver-js');
const WhiteListController = require('./contracts/WhiteListController');

const caver = new Caver(
  new Caver.providers.HttpProvider("https://node-api.klaytnapi.com/v1/klaytn", {
    headers: [
      {
        name: "Authorization",
        value: "Basic S0FTS0ZDRzJDTzVYTEdSS1RaQzVaM1FEOnVLVThZa0w5ZF9lQ09vZ2hQejVkamZBeXpIS0M3WmhURGZ1OHBuclo=",
      },
      // 8217 is mainnet's chain-id
      // 1001 is testnet's chain-id
      { name: "x-chain-id", value: process.env.mainnet ? 8217 : 1001 },
    ],
    keepAlive: true,
  })
);

//All variable will be pulled from env once deployed sls
const transferController = process.env.controllerAddress;
const publicAddress = process.env.publicAddress;
const privateKey = process.env.privateKey;

const controller = new caver.klay.Contract(WhiteListController.abi, transferController).methods;
module.exports.whitelist = async (event) => {
  console.log(event);
  if (!event.hasOwnProperty('queryStringParameters')) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid address Provided'
      }),
    };

  }
  const address = event.queryStringParameters.address;
  console.log(address)
  if (!caver.utils.isAddress(address)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid address Provided'
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
          message: 'Address Already Whitelisted'
        },
        null,
        2
      ),
    };
  }

  let data = controller.addOrChangeUserStatus(address, true).encodeABI();

  let signedTransaction = await caver.klay.accounts.signTransaction(
    {
      type: "SMART_CONTRACT_EXECUTION",
      from: publicAddress,
      to: transferController,
      data,
      gas: 305026,
    },
    privateKey
  );

  try {
    const { transactionHash } = await caver.klay.sendSignedTransaction(signedTransaction.rawTransaction);
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Address Whitelisted Successfully',
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
          message: 'Something Went Wrong. Please Contact To Customer Care',
        },
        null,
        2
      ),
    };
  }
};
