// ChakraUI
import { Heading, Flex, Text } from "@chakra-ui/react"

// Viem
import { formatEther } from "viem"

const Events = ({ depositEvents, widthdrawEvents }) => {
    return (
        <>
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
            {widthdrawEvents.length > 0 ? widthdrawEvents.map((event) => {
                return <Flex key={crypto.randomUUID()}><Text>
                {event.address} - {formatEther(event.amount)} Eth</Text>
                </Flex>
            }) : (
                <Text>No Withdraw Events</Text>
            )}   
            </Flex>
        </>
    )
}

export default Events