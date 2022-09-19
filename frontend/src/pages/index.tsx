import {
  Flex,
  Stack,
  Heading,
  Text,
  Box,
  Button,
  Circle,
  useColorModeValue,
} from '@chakra-ui/react'
import { ethers } from 'ethers'
import { useAtom } from 'jotai'
import type { NextPage } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import CarbonMonsterArtifact from '../contracts/CarbonMonster.json'
import bctABI from '../contracts/bctABI.json'
import contractAddress from '../contracts/contract-address.json'
import { useMonster } from '../hooks'
import { blockchainAtom, receiptAtom } from '../store'

const mumbaiAddresses = {
  bct: '0xf2438A14f668b1bbA53408346288f3d7C71c10a1',
  nct: '0x7beCBA11618Ca63Ead5605DE235f6dD3b25c530E',
}

const Home: NextPage = () => {
  const POLYGON_MUMBAI_CHAIN_ID = 80001
  const NETWORK_NAME = 'Polygon Mumbai'
  const GAS_LIMIT = 600000

  const [blockchain, setBlockchain] = useAtom(blockchainAtom)
  const [receipt, setReceipt] = useAtom(receiptAtom)

  const [minting, setMinting] = useState<boolean>(false)
  const [feeding, setFeeding] = useState<boolean>(false)

  const [monster, setMonster] = useMonster()

  const truncate = (input: string, len: number) =>
    input.length > len ? `${input.substring(0, len)}...` : input

  const connect = async () => {
    const { ethereum } = window
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask

    if (!metamaskIsInstalled) {
      alert('Install Metamask.')
      return
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      const account = accounts[0]
      const networkId = await ethereum.request({ method: 'net_version' })

      if (networkId != POLYGON_MUMBAI_CHAIN_ID) {
        alert(`Change network to ${NETWORK_NAME}.`)
        return
      }

      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(
        contractAddress.CarbonMonster,
        CarbonMonsterArtifact.abi,
        signer,
      )

      setBlockchain({
        account,
        contract,
      })

      const filter = contract.filters.MonsterUpdated(account)
      contract.on(filter, (from, id, image, totalFeededAmount) => {
        console.log('MonsterUpdated', Number(totalFeededAmount.toString()))
        setMonster({
          id: Number(id.toString()),
          image,
          totalFeededAmount: Number(totalFeededAmount.toString()),
        })
      })
    } catch (e) {
      console.log('e', e)
    }
  }

  const mint = async () => {
    if (!blockchain) return

    setReceipt(null)
    setMinting(true)

    try {
      const tx = await blockchain.contract.mint({
        gasLimit: GAS_LIMIT,
      })
      console.log('tx', tx)
      const txResult = await tx.wait()
      console.log('txResult', txResult)
      setReceipt(txResult)
    } catch (e) {
      console.log('Minting error', e)
    } finally {
      setMinting(false)
    }
  }

  const feed = async () => {
    if (!blockchain || !monster) return

    setReceipt(null)
    setFeeding(true)

    const { ethereum } = window
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const bctContract = new ethers.Contract(mumbaiAddresses.bct, bctABI, signer)

    const costWei = '100000000000000000'

    try {
      const approveBCT = await bctContract.approve(
        contractAddress.CarbonMonster,
        costWei,
      )
      console.log('approveBCT', approveBCT)
      const tx = await blockchain.contract.feed(
        monster.id,
        mumbaiAddresses.bct,
        costWei,
        {
          gasLimit: GAS_LIMIT,
        },
      )
      console.log('tx', tx)
      const txResult = await tx.wait()
      console.log('txResult', txResult)
      setReceipt(txResult)
    } catch (e) {
      console.log('Minting error', e)
    } finally {
      setFeeding(false)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    console.log('handleAccountsChanged', accounts)
    if (accounts.length === 0) {
      alert('Please connect to MetaMask.')
    } else {
      setBlockchain((oldBlockchain) => {
        if (!oldBlockchain) return null
        return {
          ...oldBlockchain,
          account: accounts[0],
        }
      })
    }
  }

  const handleChainChanged = (chainId: string) => {
    if (parseInt(chainId, 16) != POLYGON_MUMBAI_CHAIN_ID) {
      window.location.reload()
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  })

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      py={8}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack
        boxShadow={'2xl'}
        bg={useColorModeValue('white', 'gray.700')}
        rounded={'xl'}
        p={10}
        spacing={8}
        align={'center'}
      >
        <Flex width={'full'} align={'center'} justify={'space-around'}>
          <Circle size='5px' bg='limegreen' color='white'></Circle>
          <Circle size='10px' bg='limegreen' color='white'></Circle>
          <Circle size='15px' bg='limegreen' color='white'></Circle>
          <Circle size='20px' bg='limegreen' color='white'></Circle>
          <Circle size='30px' bg='limegreen' color='white'></Circle>
          <Circle size='10px' bg='red' color='white'></Circle>
        </Flex>
        <Stack align={'center'} spacing={4}>
          <Heading
            textTransform={'uppercase'}
            fontSize={'3xl'}
            color={useColorModeValue('gray.800', 'gray.200')}
            textAlign='center'
          >
            Mint your Carbon Monster 👻
            <br />
            (Mumbai Testnet)
          </Heading>
          <Text fontSize={'lg'} color={'gray.500'} align='center'>
            Feed tokens to your monster to offset carbon emissions!
            <br /> Currently only BCT is available for feeding. <br />
            <Link href='https://tco-2-faucet-ui.vercel.app/'>
              <a target='_blank'>You can get test BCT here →</a>
            </Link>
          </Text>
          <Box color='gray.500'>
            <Link href='https://blog.toucan.earth/base-carbon-tonne-bct-a-new-web3-building-block/'>
              <a target='_blank'>*What is BCT?</a>
            </Link>
          </Box>
        </Stack>
        <Stack
          spacing={4}
          direction={{ base: 'column', md: 'column' }}
          w={'full'}
          align='center'
        >
          <Box color='gray.700'>
            <Link
              href={`https://mumbai.polygonscan.com/address/${contractAddress.CarbonMonster}`}
            >
              <a target='_blank'>
                Contract Address: {truncate(contractAddress.CarbonMonster, 15)}
              </a>
            </Link>
          </Box>

          {!blockchain && (
            <>
              <Text fontSize='sm'>Connect to the {NETWORK_NAME} network</Text>
              <Button
                bg={'limegreen'}
                rounded={'full'}
                color={'white'}
                _hover={{ bg: 'green.500' }}
                _focus={{ bg: 'green.500' }}
                onClick={connect}
              >
                Connect
              </Button>
            </>
          )}

          {blockchain && !monster && (
            <Button
              bg={'limegreen'}
              rounded={'full'}
              color={'white'}
              flex={'1 0 auto'}
              _hover={{ bg: 'green.500' }}
              _focus={{ bg: 'green.500' }}
              isLoading={minting}
              loadingText='Minting'
              onClick={mint}
            >
              Mint
            </Button>
          )}

          {blockchain && monster && (
            <>
              <Box bg='limegreen' w='100%' h={1} />
              <Text fontSize='lg'>Carbon Monster #{monster.id}</Text>
              <Text>
                Total Feeded Amount:{' '}
                {ethers.utils.formatEther(monster.totalFeededAmount.toString())}
              </Text>
              <Image
                src={monster.image}
                width={200}
                height={200}
                alt='Carbon Monster'
              />
              <Button
                bg={'limegreen'}
                rounded={'full'}
                color={'white'}
                flex={'1 0 auto'}
                _hover={{ bg: 'green.500' }}
                _focus={{ bg: 'green.500' }}
                isLoading={feeding}
                loadingText='Feeding'
                onClick={feed}
              >
                Feed
              </Button>
            </>
          )}
        </Stack>
        {receipt && (
          <Link
            href={`https://mumbai.polygonscan.com/tx/${receipt.transactionHash}`}
          >
            <a target='_blank'>🎁 View transaction on etherscan 👏</a>
          </Link>
        )}
      </Stack>
    </Flex>
  )
}

export default Home
