"use client"

// REACT 
import { useState, useEffect } from 'react'

// CHAKRA-UI
import { Flex } from '@chakra-ui/react'

// CONTRACT
import { contractAddress, abi } from '@/constants'

// WAGMI
import { getPublicClient } from '@wagmi/core'
import { useAccount, useContractRead } from 'wagmi'

// VIEM (pour les events)
import { http, parseAbiItem } from 'viem'

// Components 
import Balance from '../Balance/Balance'
import Deposit from '../Deposit/Deposit'
import Withdraw from '../Withdraw/Withdraw'
import Events from '../Events/Events'
import NotConnected from '../NotConnected/NotConnected'

/*
Ce code est un hook personnalisé écrit en JavaScript pour les applications React. Il s'appelle useDebounce. Un hook personnalisé permet de réutiliser une logique d'état ou d'effets dans différents composants. Ce code en particulier est utilisé pour mettre en œuvre un comportement de debounce. Le debounce est une technique de programmation utilisée pour s'assurer qu'une fonction n'est pas appelée trop fréquemment, ce qui peut être utile pour des opérations coûteuses en termes de performances, comme des appels API ou des calculs lourds qui se déclenchent en réponse à des événements fréquents (comme la frappe au clavier).
*/
import { useDebounce } from '@/utils/useDebounce'

const Bank = () => {

    // Create client for Viem
    const client = getPublicClient()

    // Reprendre les infos du wallet connecté
    const { isConnected, address } = useAccount()

    // STATES
    // Input deposit
    const [depositAmount, setDepositAmount] = useState('')
    // Input withdraw
    const [withdrawAmount, setWithdrawAmount] = useState('')
    // Permet l'affichage de la balance de l'utilisateur
    const [balance, setBalance] = useState('')
    // Liste des évènements deposit
    const [depositEvents, setDepositEvents] = useState([])
    // Liste des évènements withdraw
    const [widthdrawEvents, setWidthdrawEvents] = useState([])

    /* Appelle le hook "useDebounce" avec deux arguments :
    "depositAmount" : La valeur actuelle à débouncer.
    "1000" : Le délai en millisecondes (ici, 1 secondes). useDebounce attendra que ce délai s'écoule sans autre modification de depositAmount avant de mettre à jour debouncedDepositAmount avec la dernière valeur de depositAmount.
    */ 
    const debouncedDepositAmount = useDebounce(depositAmount, 1000)
    const debouncedWithdrawAmount = useDebounce(withdrawAmount, 1000)

    // On récupère la balance de l'utilisateur
    // userBalance : Renomme la propriété "data" en "userBalance". Permet de récupérer le résultat de la requête
    // userBalanceLoading : Cette variable est un booléen qui indique si la requête est en cours de chargement
    // refetchBalanceOfUser : Cette fonction peut être utilisée pour re-exécuter la requête et obtenir les données les plus récentes du contrat.
    const { data: userBalance, isLoading: userBalanceLoading, refetch: refetchBalanceOfUser } = useContractRead({
        address: contractAddress,
        abi: abi,
        functionName: 'getBalanceOfUser',
        account: address
    })

    // On récupère les évènements "withdraw" et "deposit"
    const getEvents = async() => {
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

    // On récupère tous les évènements lorsqu'un utilisateur se connecte
    useEffect(() => {
        const getAllEvents = async() => {
            if(isConnected) {
                await getEvents()
            }
        }
        getAllEvents()
    }, [address])

    return (
        <>
            <Flex width="100%">
                {/* Si l'utilisateur est connecté */}
                {isConnected ? (
                    <Flex direction="column" width="100%">
                        <Balance 
                            userBalanceLoading={userBalanceLoading} userBalance={userBalance} 
                        />
                        <Deposit debouncedDepositAmount={debouncedDepositAmount} depositAmount={depositAmount} setDepositAmount={setDepositAmount} getEvents={getEvents} refetchBalanceOfUser={refetchBalanceOfUser} />
                        <Withdraw debouncedWithdrawAmount={debouncedWithdrawAmount} withdrawAmount={withdrawAmount} setWithdrawAmount={setWithdrawAmount} getEvents={getEvents} refetchBalanceOfUser={refetchBalanceOfUser} userBalance={userBalance} />
                        <Events depositEvents={depositEvents} widthdrawEvents={widthdrawEvents} />
                    </Flex>
                ) : (
                    <NotConnected />
                )}
                
            </Flex>
        </>
    )
}

export default Bank