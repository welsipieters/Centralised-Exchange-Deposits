import {container} from "../inversify.config";
import {IBlockchainService, IDatabaseService} from "../interfaces";
import types from "../types";
import axios from "axios";
interface AddressRequest {
    id: number;
    user_id: number;
    uuid: string;
    currency: string;
}
const fetchAddressesFromExternalAPI = async (config) => {
    const blockchainService = container.get<IBlockchainService>(types.Blockchain);

    const getEndpoint = 'get-deposit-address-requests';
    const setEndpoint = 'set-deposit-addresses';
    const params = {
        walletAPIKey: config.keys.admin,
        currency: 'USDT',
    };

    // Fetch the wanted addresses
    const response = await axios.post(`${config.knakenURL}${getEndpoint}`, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Knaken-Wallet-Processor': config.keys.core
        }
    });


    const wantedAddresses: AddressRequest[] = await response.data;

    const databaseService = container.get<IDatabaseService>(types.Database);
    const addressMap: { [key: number]: string } = {};

    for (const wantedAddress of wantedAddresses) {
        let addressEntity = await databaseService.fetchAndMarkUnusedAddress();

        if (!addressEntity) {
            blockchainService.generateAddresses(parseInt(process.env.BATCH_SIZE || '10')).catch((error) => {
                console.error('Error generating addresses:', error);
            });

            console.log(`Ran out of addresses. Generated new batch of addresses`);

            break;
        }

        if (addressEntity) {
            addressMap[wantedAddress.id] = addressEntity.deposit_address;
        }
    }

    console.log(addressMap);

    // Send the address map back to the external API

    if (Object.keys(addressMap).length === 0) {
        console.log('No addresses to set');
        return;
    }
    const setAddressResponse = await axios.post(`${config.knakenURL}${setEndpoint}`, {
        walletAPIKey: config.keys.admin,
        addresses: addressMap
    }, {
        headers: {
            'Content-Type': 'application/json',
            'X-Knaken-Wallet-Processor': config.keys.core
        }
    });




    console.log('Successfully set addresses', setAddressResponse.statusText, setAddressResponse.status, setAddressResponse.data);

};

export default fetchAddressesFromExternalAPI;