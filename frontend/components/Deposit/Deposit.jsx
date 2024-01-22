// ChakraUI
import { Heading, Flex, Input, Button, useToast } from "@chakra-ui/react"

// ReactJS
import { useEffect, useRef } from "react";

// Smart contract informations
import { contractAddress, abi } from "@/constants";

// Wagmi
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction, useContractEvent } from "wagmi";

// Viem
import { parseEther } from "viem";

const Deposit = ({ debouncedDepositAmount, depositAmount, setDepositAmount, getEvents, refetchBalanceOfUser }) => {

    const toast = useToast();

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

    // On met à jour le state si la valeur entrée dans le champs input est un nombre
    const handleDepositAmount = (arg) => {
        if(!isNaN(arg)) {
            setDepositAmount(arg);
        }
    }

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

    // S'il y a une erreur dans le deposit, on affiche l'erreur
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
    }, [depositWriteError])

    return (
        <>
            <Heading as='h2' size='xl' mt="2rem">
                Deposit
            </Heading>
            <Flex mt="1rem">
                {/* Contient un champ de saisie (Input) pour entrer le montant du dépôt et un bouton pour soumettre le dépôt. Le bouton est désactivé si writeDeposit est false ou si isLoadingDeposit est true. */}
                <Input onChange={e => handleDepositAmount(e.target.value)} placeholder="Amount in Eth" value={depositAmount} />
                <Button disabled={!writeDeposit || isLoadingDeposit}colorScheme='whatsapp' onClick={() => writeDeposit?.()}>{isLoadingDeposit ? 'Depositing...' : 'Deposit'}</Button>
            </Flex>
        </>
    )
}

export default Deposit