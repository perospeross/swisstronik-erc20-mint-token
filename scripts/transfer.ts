import { ethers, network } from 'hardhat'
import { encryptDataField } from '@swisstronik/utils'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/src/signers'
import { HttpNetworkConfig } from 'hardhat/types'
import deployedAddress from '../utils/deployed-address'
import * as fs from 'fs'
import * as path from 'path'

const sendShieldedTransaction = async (
  signer: HardhatEthersSigner,
  destination: string,
  data: string,
  value: number
) => {
  const rpclink = (network.config as HttpNetworkConfig).url

  const [encryptedData] = await encryptDataField(rpclink, data)

  return await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    value,
  })
}

async function main() {
  const contractAddress = deployedAddress

  const [signer] = await ethers.getSigners()

  const contractFactory = await ethers.getContractFactory('TestToken')
  const contract = contractFactory.attach(contractAddress)

  const functionName = 'transfer'
  const receiptAddress = '0x16af037878a6cAce2Ea29d39A3757aC2F6F7aac1' // don't modify
  const amount = 1 * 10 ** 18
  const functionArgs = [receiptAddress, `${amount}`]
  const setMessageTx = await sendShieldedTransaction(
    //@ts-ignore
    signer,
    contractAddress,
    contract.interface.encodeFunctionData(functionName, functionArgs),
    0
  )
  await setMessageTx.wait()

  console.log('Transaction Receipt: ', setMessageTx.hash)
  const filePath = path.join(__dirname, '../utils/tx-hash.txt')
  fs.writeFileSync(filePath, `Tx hash : https://explorer-evm.testnet.swisstronik.com/tx/${setMessageTx.hash}\n`, {
    flag: 'a',
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
