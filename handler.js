'use strict';

const Caver = require('caver-js');
const WhiteListController = require('./contracts/WhiteListController');

const caver = new Caver(
  new Caver.providers.HttpProvider("https://node-api.klaytnapi.com/v1/klaytn", {
    headers: [
      {
        name: "Authorization",
        value: "Basic S0FTS09YVFJNM1NKRTg0QkYzUVpHWlFFOlFUdE1xZjBMbG5xdi0yN3U0U3VpcGtXZUpqMlg3NmV6YldGUGRZTHg=",
      },
      // 8217 is mainnet's chain-id
      // 1001 is testnet's chain-id
      { name: "x-chain-id", value: /*process.env.mainnet ?*/ 8217/* : 1001*/ },
    ],
    keepAlive: true,
  })
);

//All variable will be pulled from env once deployed sls
const transferController = '0x6daA654DEA8880638c5AD0eD0B16531D292213E3';
const publicAddress = '0x885eaf1fA9604235d7F5C8B7Da1c732e82561B6B';


const privateKey = '0x7ed79d2085dcf946d73d21cf52790e0912d13f7b400333ed2340a1404a6008d9';

const controller = new caver.klay.Contract(WhiteListController.abi, transferController).methods;
module.exports.hello = async (event) => {
  const address = JSON.parse(event.body).address;
  if (caver.utils.isAddress(address)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid address Provided'
      }),
    };
  }

  let data = controller.addAddressToWhiteList(address, true).encodeABI();

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
