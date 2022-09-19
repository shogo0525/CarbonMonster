import { ethers } from 'ethers'
import { atom } from 'jotai'

export const blockchainAtom = atom<BlockchainInfo | null>(null)

export const receiptAtom = atom<ethers.ContractReceipt | null>(null)

export const monsterAtom = atom<Monster | null>(null)
