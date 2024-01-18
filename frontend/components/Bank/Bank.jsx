"use client"

// REACT 
import { useState, useEffect } from 'react'

// CHAKRA-UI
import { Heading, Flex, Text, Input, Button, useToast, Spinner } from '@chakra-ui/react'

// CONTRACT
import { contractAddress, abi } from '@/constants'

// WAGMI
import { prepareWriteContract, writeContract, readContract, getPublicClient } from '@wagmi/core'
import { useAccount, useContractRead, usePrepareContractWrite, useWaitForTransaction, useContractWrite } from 'wagmi'

// VIEM (pour les events)
import { http, parseAbiItem } from 'viem'
import { hardhat } from 'viem/chains'

import { parseEther, formatEther } from 'viem'

import { useDebounce } from '@/utils/useDebounce'

const Bank = () => {

    // Create client for Viem
    const client = getPublicClient()

    // Toast (obligé)
    const toast = useToast()

    // Reprendre les infos du wallet connecté
    const { isConnected, address } = useAccount()

    // STATES
    const [depositAmount, setDepositAmount] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [balance, setBalance] = useState('')
    const [depositEvents, setDepositEvents] = useState([])
    const [widthdrawEvent, setWidthdrawEvents] = useState([])

    // Get balance of User
    const { data: userBalance, isLoading: userBalanceLoading, refetch: refetchBalanceOfUser } = useContractRead({
        address: contractAddress,
        abi: abi,
        functionName: 'getBalanceOfUser',
        account: address,
        suspense: true
    })

    const debouncedDepositAmount = useDebounce(depositAmount, 500)

    // Deposit 
    // Prepare the transaction
    const { config: configDeposit, error: contractWriteError } = usePrepareContractWrite({
        address: contractAddress,
        abi: abi,
        functionName: 'deposit',
        value: parseEther(debouncedDepositAmount),
        enabled: Boolean(debouncedDepositAmount),
        onError() {
            toast({
                title: 'Error.',
                description: "An error occured.",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    });

    /*args: [parseInt(debouncedTokenId)],
    enabled: Boolean(debouncedTokenId),*/

    // Get the write function
    const { data: dataDeposit, write: writeDeposit } = useContractWrite(configDeposit)

    const { isLoading: isLoadingDeposit, isSuccess: isSuccessDeposit } = useWaitForTransaction({
        hash: dataDeposit?.hash,
        onSuccess(dataDeposit) {
            refetchBalanceOfUser();
            toast({
                title: 'Congratulations.',
                description: "Deposit was successfull.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        }
    })

    // Deposit
    // const deposit = async() => {
    //     if(!depositAmount) {
    //         toast({
    //             title: 'Warning.',
    //             description: "Please enter a number.",
    //             status: 'warning',
    //             duration: 4000,
    //             isClosable: true,
    //         })
    //         return;
    //     }
    //     try {
    //         console.log(depositAmount)
    //         const { request } = await prepareWriteContract({
    //             address: contractAddress,
    //             abi: abi,
    //             functionName: "deposit",
    //             value: parseEther(depositAmount)
    //         });
    //         await writeContract(request)

    //         setDepositAmount('');

    //         // const balance = await getBalanceOfUser()
    //         // setBalance(formatEther(balance))

    //         await getEvents()

    //         toast({
    //             title: 'Congratulations!',
    //             description: `You have successfully deposited ${depositAmount} ETH`,
    //             status: 'success',
    //             duration: 3000,
    //             isClosable: true,
    //         })
    //     }
    //     catch(err) {
    //         toast({
    //             title: 'Error!',
    //             description: err.message,
    //             status: 'error',
    //             duration: 3000,
    //             isClosable: true,
    //         })
    //     }
    // }

    // Withdraw
    const withdraw = async () => {
        if(!withdrawAmount) {
            toast({
                title: 'Warning.',
                description: "Please enter a number.",
                status: 'warning',
                duration: 4000,
                isClosable: true,
            })
            return;
        }
        try {
            // On fait le withdraw
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: abi,
                functionName: "withdraw",
                args: [parseEther(withdrawAmount)]
            });
            await writeContract(request);

            setWithdrawAmount('');

            // On met à jour la balance
            const balance = await getBalanceOfUser()
            setBalance(formatEther(balance))

            await getEvents()

            toast({
                title: 'Congratulations.',
                description: "You have made a withdraw!",
                status: 'success',
                duration: 3000,
                isClosable: true,
            })
        } catch (err) {
            toast({
                title: 'Error.',
                description: err.message,
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    }

    // Get all the events 
    const getEvents = async() => {
        // get all the deposit events 
        const depositLogs = await client.getLogs({
            event: parseAbiItem('event etherDeposited(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 'latest' // Pas besoin valeur par défaut
        })
        setDepositEvents(depositLogs.map(
            log => ({
                address: log.args.account,
                amount: log.args.amount
            })
        ))

        // get all the withdraw events 
        const withdrawLogs = await client.getLogs({
            event: parseAbiItem('event etherWithdrawed(address indexed account, uint amount)'),
            fromBlock: 0n,
        })
        setWidthdrawEvents(withdrawLogs.map(
            log => ({
                address: log.args.account,
                amount: log.args.amount
            })
        ))
    }

    const handleDepositAmount = (arg) => {
        if(!isNaN(arg)) {
            setDepositAmount(arg);
        }
    }

    return (
        <>
            <Flex width="100%">
                {isConnected ? (
                    <Flex direction="column" width="100%">
                        <Heading as='h2' size='xl'>
                            Your balance in the Bank
                        </Heading>
                        {userBalanceLoading ? (
                            <Spinner />
                        ) : (
                            <Text mt="1rem">{formatEther(userBalance?.toString())} Eth</Text>
                        )}
                        <Heading as='h2' size='xl' mt="2rem">
                            Deposit
                        </Heading>
                        <Flex mt="1rem">
                            <Input onChange={e => handleDepositAmount(e.target.value)} placeholder="Amount in Eth" value={depositAmount} />
                            <Button disabled={!writeDeposit || isLoadingDeposit}colorScheme='whatsapp' onClick={() => writeDeposit?.()}>{isLoadingDeposit ? 'Depositing...' : 'Deposit'}</Button>
                        </Flex>
                        <Heading as='h2' size='xl' mt="2rem">
                            Withdraw
                        </Heading>
                        <Flex mt="1rem">
                            <Input onChange={(e) => handleWithdrawAmount(e.target.value)} placeholder="Amount in Eth" value={withdrawAmount} />
                            <Button colorScheme='whatsapp' onClick={() => withdraw()}>Withdraw</Button>
                        </Flex>
                        <Heading as='h2' size='xl' mt="2rem">
                            Deposit Events
                        </Heading>
                        <Flex mt="1rem" direction="column">
                        {depositEvents.length > 0 ? depositEvents.map((event) => {
                            return <Flex key={crypto.randomUUID()}><Text>
                            {event.address} - {formatEther(event.amount)} Eth</Text>
                            </Flex>
                        }) : (
                            <Text>No Deposit Events</Text>
                        )}
                        </Flex>
                        <Heading as='h2' size='xl' mt="2rem">
                            Withdraw Events
                        </Heading>
                        <Flex mt="1rem" direction="column">
                        {widthdrawEvent.length > 0 ? widthdrawEvent.map((event) => {
                            return <Flex key={crypto.randomUUID()}><Text>
                            {event.address} - {formatEther(event.amount)} Eth</Text>
                            </Flex>
                        }) : (
                            <Text>No Withdraw Events</Text>
                        )}   
                        </Flex>
                    </Flex>
                ) : (
                    <Flex p="2rem" justifyContent="center" alignItems="center" width="100%">
                        <Text>Please connect your Wallet</Text>
                    </Flex>
                )}
                
            </Flex>
        </>
    )
}

export default Bank