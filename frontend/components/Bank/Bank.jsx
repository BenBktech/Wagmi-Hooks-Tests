"use client"

// REACT 
import { useState, useEffect, useRef } from 'react'

// CHAKRA-UI
import { Heading, Flex, Text, Input, Button, useToast, Spinner } from '@chakra-ui/react'

// CONTRACT
import { contractAddress, abi } from '@/constants'

// WAGMI
import { prepareWriteContract, writeContract, readContract, getPublicClient } from '@wagmi/core'
import { useAccount, useContractRead, usePrepareContractWrite, useWaitForTransaction, useContractWrite, useContractEvent } from 'wagmi'

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
    const debouncedWithdrawAmount = useDebounce(withdrawAmount, 500)

    // Deposit 
    // Prepare the transaction
    const { config: configDeposit } = usePrepareContractWrite({
        address: contractAddress,
        abi: abi,
        functionName: 'deposit',
        value: parseEther(debouncedDepositAmount),
        enabled: Boolean(debouncedDepositAmount) && parseInt(debouncedDepositAmount) !== 0,
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

    // Get the write function
    const { data: dataDeposit, write: writeDeposit, error: depositWriteError } = useContractWrite(configDeposit)

    const { isLoading: isLoadingDeposit, isSuccess: isSuccessDeposit } = useWaitForTransaction({
        hash: dataDeposit?.hash,
        onSuccess(dataDeposit) {
            hashRef.current = dataDeposit.hash;
            refetchBalanceOfUser();
            setDepositAmount('');
            toast({
                title: 'Congratulations.',
                description: "Deposit was successfull.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        }
    })

    // Withdraw 
    // Prepare the transaction
    const { config: configWithdraw } = usePrepareContractWrite({
        address: contractAddress,
        abi: abi,
        functionName: 'withdraw',
        args: [parseEther(debouncedWithdrawAmount)],
        enabled: Boolean(debouncedWithdrawAmount) && parseFloat(debouncedWithdrawAmount) <= parseFloat(formatEther(userBalance)),
        onError() {
            toast({
                title: 'Error.',
                description: "An error occured.",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        },
        onSuccess() {
            console.log('c good');
        }
    });

    // Get the write function
    const { data: dataWithdraw, write: writeWithdraw, error: withdrawWriteError } = useContractWrite(configWithdraw)

    const { isLoading: isLoadingWithdraw, isSuccess: isSuccessWithdraw } = useWaitForTransaction({
        hash: dataWithdraw?.hash,
        onSuccess(dataWithdraw) {
            refetchBalanceOfUser();
            setWithdrawAmount('');
            toast({
                title: 'Congratulations.',
                description: "Withdraw was successfull.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        },
        onError() {
            console.log('erreur');
        }
    })

    // Permet d'écouter si un évènement "etherDeposited" a été émis
    /* 
    useRef est utilisé pour conserver une référence mutable qui persiste pour la durée de vie du composant, sans déclencher de re-rendu lorsqu'elle est modifiée.
    C'est utile pour accéder à un élément DOM directement, stocker une valeur qui ne doit pas déclencher de re-rendu lorsqu'elle change, ou conserver une valeur entre les  re-rendus sans déclencher un nouveau re-rendu.
    */
    const hashRef = useRef();
    const unwatch = useContractEvent({
        address: contractAddress,
        abi: abi,
        eventName: 'etherDeposited',
        listener(log) {
            if (log[0]?.transactionHash !== hashRef.current) return;
            // never reached
            toast({
                title: 'Event emitted.',
                description: "A deposit event has been emitted.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        },
    })
    
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

    const handleWithdrawAmount = (arg) => {
        if(!isNaN(arg)) {
            setWithdrawAmount(arg);
        }
    }

    useEffect(() => {
        if(depositWriteError) {
            toast({
                title: 'Error.',
                description: depositWriteError.message,
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
        if(withdrawWriteError) {
            toast({
                title: 'Error.',
                description: withdrawWriteError.message,
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    }, [depositWriteError, withdrawWriteError])

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
                            <Input onChange={e => handleWithdrawAmount(e.target.value)} placeholder="Amount in Eth" value={withdrawAmount} />
                            <Button disabled={!writeWithdraw || isLoadingWithdraw}colorScheme='whatsapp' onClick={() => writeWithdraw?.()}>{isLoadingWithdraw ? 'Withdrawing...' : 'Withdraw'}</Button>
                        </Flex>
                        {parseFloat(debouncedWithdrawAmount) > parseFloat(formatEther(userBalance)) && <Text color='red' mt='.5rem'>You cannot withdraw more than {parseFloat(formatEther(userBalance))} ETH.</Text>}
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