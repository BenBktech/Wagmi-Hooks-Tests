import { Flex, Text } from "@chakra-ui/react"

const NotConnected = () => {
  return (
    // Si l'utilisateur n'est pas connecté
    <Flex p="2rem" justifyContent="center" alignItems="center" width="100%">
        <Text>Please connect your Wallet</Text>
    </Flex>
  )
}

export default NotConnected