import { Spinner, Heading, Text } from "@chakra-ui/react"

import { formatEther } from "viem"

const Balance = ({ userBalanceLoading, userBalance }) => {
  return (
    <>
        <Heading as='h2' size='xl'>
            Your balance in the Bank
        </Heading>
        {/* Utilise une condition pour vérifier si userBalanceLoading est true. Si oui, affiche un Spinner (indicateur de chargement). Sinon, affiche le solde de l'utilisateur converti en Ether (formatEther(userBalance?.toString())). */}
        {userBalanceLoading ? (
            <Spinner />
        ) : (
            <Text mt="1rem">{formatEther(userBalance?.toString())} Eth</Text>
        )}
    </>
  )
}

export default Balance