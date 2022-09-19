import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useCallback, SetStateAction } from 'react'
import { blockchainAtom, monsterAtom } from '../store'

export const useMonster = (): [
  Monster | null,
  (update: SetStateAction<Monster | null>) => void,
] => {
  const blockchain = useAtomValue(blockchainAtom)
  const [monster, setMonster] = useAtom(monsterAtom)

  const getMonster = useCallback(
    async (tokenId: number): Promise<Monster | null> => {
      if (!blockchain) return null

      try {
        const monster = await blockchain.contract.getMonster(tokenId)
        console.log('monster', monster)
        return {
          id: tokenId,
          image: monster.svg,
          totalFeededAmount: monster.totalFeededAmount.toString(),
        }
      } catch (e) {
        console.log('error', e)
        return null
      }
    },
    [blockchain],
  )

  const getData = useCallback(async () => {
    if (!blockchain) return

    try {
      const balance = await blockchain.contract.balanceOf(blockchain.account)
      if (Number(balance.toString()) === 0) return

      const tokenId = Number(
        (
          await blockchain.contract.tokenOfOwnerByIndex(blockchain.account, 0)
        ).toString(),
      )

      const monster = await getMonster(tokenId)
      if (monster) setMonster(monster)
    } catch (e) {
      console.log('error', e)
    }
  }, [blockchain, getMonster, setMonster])

  useEffect(() => {
    getData()
  }, [getData, blockchain])

  return [monster, setMonster]
}
