// ChakraUI
import { Heading, Flex, Text, Input, Button, useToast } from "@chakra-ui/react"

// ReactJS
import { useEffect, useRef } from "react";

// Smart contract informations
import { contractAddress, abi } from "@/constants";

// Wagmi
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction, useContractEvent } from "wagmi";

// Viem
import { formatEther, parseEther } from "viem";

const Withdraw = ({ debouncedWithdrawAmount, withdrawAmount, setWithdrawAmount, getEvents, refetchBalanceOfUser, userBalance }) => {

    const toast = useToast()

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

    const handleWithdrawAmount = (arg) => {
        if(!isNaN(arg)) {
            setWithdrawAmount(arg);
        }
    }

    // S'il y a une erreur dans le withdraw, on affiche l'erreur
    useEffect(() => {
        if(withdrawWriteError) {
            toast({
                title: 'Error',
                description: withdrawWriteError.message,
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    }, [withdrawWriteError])

    return (
        <>
            <Heading as='h2' size='xl' mt="2rem">
                Withdraw
            </Heading>
            <Flex mt="1rem">
                <Input onChange={e => handleWithdrawAmount(e.target.value)} placeholder="Amount in Eth" value={withdrawAmount} />
                <Button disabled={!writeWithdraw || isLoadingWithdraw}colorScheme='whatsapp' onClick={() => writeWithdraw?.()}>{isLoadingWithdraw ? 'Withdrawing...' : 'Withdraw'}</Button>
            </Flex>
            {/* On s'assure que l'utilisateur n'essaie pas de retirer plus que son solde. */}
            {parseFloat(debouncedWithdrawAmount) > parseFloat(formatEther(userBalance)) && <Text color='red' mt='.5rem'>You cannot withdraw more than {parseFloat(formatEther(userBalance))} ETH.</Text>}
        </>
    )
}

export default Withdraw