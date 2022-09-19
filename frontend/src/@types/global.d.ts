interface Window {
  ethereum: any
}

type BlockchainInfo = {
  account: string
  contract: ethers.Contract
}

type Monster = {
  id: number
  image: string
  totalFeededAmount: number
}
