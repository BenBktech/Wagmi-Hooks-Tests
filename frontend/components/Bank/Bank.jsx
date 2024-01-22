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

// VIEM (pour gérer les conversions Ether/Wei et inversement)
import { parseEther, formatEther } from 'viem'

/*
Ce code est un hook personnalisé écrit en JavaScript pour les applications React. Il s'appelle useDebounce. Un hook personnalisé permet de réutiliser une logique d'état ou d'effets dans différents composants. Ce code en particulier est utilisé pour mettre en œuvre un comportement de debounce. Le debounce est une technique de programmation utilisée pour s'assurer qu'une fonction n'est pas appelée trop fréquemment, ce qui peut être utile pour des opérations coûteuses en termes de performances, comme des appels API ou des calculs lourds qui se déclenchent en réponse à des événements fréquents (comme la frappe au clavier).
*/
import { useDebounce } from '@/utils/useDebounce'

const Bank = () => {

    // Create client for Viem
    const client = getPublicClient()

    // Toast (obligé)
    const toast = useToast()

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
    const [widthdrawEvent, setWidthdrawEvents] = useState([])

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

    // Deposit 
    // "usePrepareContractWrite" est un hook de wagmi utilisé pour préparer une transaction d'écriture sur un contrat intelligent.
    // La destructuration est utilisée pour extraire "config" de l'objet retourné par le hook et le renommer en "configDeposit".
    const { config: configDeposit } = usePrepareContractWrite({
        address: contractAddress,
        abi: abi,
        functionName: 'deposit',
        value: parseEther(debouncedDepositAmount),
        // Condition pour activer la transaction, ici vérifiant que le montant n'est pas nul.
        /* "Boolean(debouncedDepositAmount)"" : Convertit "debouncedDepositAmount" en un booléen. Si "debouncedDepositAmount" est une chaîne vide, null, undefined, cela sera évalué à false.
        "parseInt(debouncedDepositAmount) !== 0" : Vérifie que la valeur convertie en entier n'est pas égale à 0. Cela empêche la transaction si la valeur est 0.
        */
        enabled: Boolean(debouncedDepositAmount) && parseInt(debouncedDepositAmount) !== 0,
        // S'il y a une erreur dans la préparation de la requête
        onError() {
            toast({
                title: 'Error.',
                description: "An error occured.",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        },
        // Si la préparation de la requête se déroule correctement...
        onSuccess() {
            console.log('Preparing Deposit...')
        }
    });

    /*
    Utilise le hook "useContractWrite" de wagmi, qui est conçu pour faciliter l'écriture (envoi de transactions) sur un contrat intelligent Ethereum.
    - "configDeposit" : C'est la configuration de la transaction, préparée auparavant par "usePrepareContractWrite". Elle contient des détails tels que l'adresse du contrat, l'ABI, la fonction à appeler, et les paramètres de la transaction.
    - "data: dataDeposit" : Récupère les données de la transaction (si disponibles) et les renomme en dataDeposit.
    - "write: writeDeposit" : Récupère la fonction qui, une fois appelée, déclenchera la transaction. Elle est renommée en "writeDeposit".
    - "error: depositWriteError" : Récupère toute erreur qui pourrait survenir lors de la préparation ou de l'envoi de la transaction, renommée en "depositWriteError".
    */
    const { data: dataDeposit, write: writeDeposit, error: depositWriteError } = useContractWrite(configDeposit)

    /* Utilise le hook "useWaitForTransaction" pour attendre la confirmation de la transaction.
    - "isLoadingDeposit" indique si la transaction est en cours, et "isSuccessDeposit" indique si la transaction a été confirmée avec succès.
    - "hash: dataDeposit?.hash" : Spécifie le hash de la transaction à suivre. "dataDeposit?.hash" récupère le hash de la transaction de dépôt préparée précédemment par writeDeposit. Ici on utilise l'optional chaining operator "?",  Cet opérateur permet de lire la valeur d'une propriété située en profondeur dans une chaîne d'objets sans avoir à valider explicitement que chaque référence dans la chaîne est valide. En gros, l'expression "dataDeposit?.hash" signifie que JavaScript va d'abord vérifier si "dataDeposit" est null ou undefined. Si c'est le cas, il arrêtera l'évaluation et "dataDeposit?.hash" renverra undefined.
    Si on utilisait "dataDeposit.hash", on supposerait que "dataDeposit" est toujours un objet valide et tente d'accéder directement à sa propriété "hash".
    Si "dataDeposit" est null ou undefined, cette expression produira une erreur de type TypeError, car vous ne pouvez pas lire la propriété "hash" d'une valeur null ou undefined.
    */
    const { isLoading: isLoadingDeposit, isSuccess: isSuccessDeposit } = useWaitForTransaction({
        hash: dataDeposit?.hash,
        /*
        Si on a un succès, "hashRef.current = dataDeposit?.transactionHash"; : Stocke le hash de la transaction dans "hashRef.current". hashRef est une référence React (useRef) utilisée pour conserver une valeur à travers les rendus successifs du composant.
        */
        async onSuccess(dataDeposit) {
            hashRef.current = dataDeposit?.transactionHash;
            await getEvents();
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
            console.log('Preparing Withdraw...')
        }
    });

    // Get the write function
    const { data: dataWithdraw, write: writeWithdraw, error: withdrawWriteError } = useContractWrite(configWithdraw)

    const { isLoading: isLoadingWithdraw, isSuccess: isSuccessWithdraw } = useWaitForTransaction({
        hash: dataWithdraw?.hash,
        async onSuccess(dataWithdraw) {
            await getEvents();
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
    // useRef est un hook de React utilisé pour créer une référence (ref).
    const hashRef = useRef();
    /*
    "useContractEvent" est un hook de wagmi utilisé pour s'abonner aux événements émis par un contrat intelligent.
    La variable "unwatch" recevra une fonction de désinscription qui peut être appelée pour arrêter d'écouter l'événement.
    */
    const unwatch = useContractEvent({
        address: contractAddress,
        abi: abi,
        eventName: 'etherDeposited',
        /* 
        Cette fonction est appelée chaque fois que l'événement "etherDeposited" est émis par le contrat.
        "log[0]?.transactionHash === hashRef.current" : Vérifie si le hash de la transaction de l'événement correspond à la valeur stockée dans "hashRef.current". Cela permet de ne pas afficher le toast au rechargement de la page après un deposit.
        L'utilisation de ?. est une précaution pour s'assurer que log[0] n'est pas undefined avant d'essayer d'accéder à transactionHash.
        */
        listener(log) {
            if (log[0]?.transactionHash === hashRef.current) {
                toast({
                    title: 'Event emitted.',
                    description: "A deposit event has been emitted.",
                    status: 'success',
                    duration: 4000,
                    isClosable: true,
                })   
            }
        },
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

    // On met à jour le state si la valeur entrée dans le champs input est un nombre
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

    // On récupère tous les évènements lorsqu'un utilisateur se connecte
    useEffect(() => {
        const getAllEvents = async() => {
            if(isConnected) {
                await getEvents()
            }
        }
        getAllEvents()
    }, [address])

    // S'il y a une erreur dans le deposit ou du withdraw, on affiche l'erreur
    useEffect(() => {
        if(depositWriteError) {
            toast({
                title: 'Error',
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
                {/* Si l'utilisateur est connecté */}
                {isConnected ? (
                    <Flex direction="column" width="100%">
                        <Heading as='h2' size='xl'>
                            Your balance in the Bank
                        </Heading>
                        {/* Utilise une condition pour vérifier si userBalanceLoading est true. Si oui, affiche un Spinner (indicateur de chargement). Sinon, affiche le solde de l'utilisateur converti en Ether (formatEther(userBalance?.toString())). */}
                        {userBalanceLoading ? (
                            <Spinner />
                        ) : (
                            <Text mt="1rem">{formatEther(userBalance?.toString())} Eth</Text>
                        )}
                        <Heading as='h2' size='xl' mt="2rem">
                            Deposit
                        </Heading>
                        <Flex mt="1rem">
                            {/* Contient un champ de saisie (Input) pour entrer le montant du dépôt et un bouton pour soumettre le dépôt. Le bouton est désactivé si writeDeposit est false ou si isLoadingDeposit est true. */}
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
                        {/* On s'assure que l'utilisateur n'essaie pas de retirer plus que son solde. */}
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
                    // Si l'utilisateur n'est pas connecté
                    <Flex p="2rem" justifyContent="center" alignItems="center" width="100%">
                        <Text>Please connect your Wallet</Text>
                    </Flex>
                )}
                
            </Flex>
        </>
    )
}

export default Bank