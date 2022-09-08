import ipfsClient from 'ipfs-http-client';

// Utility Helper Functions
const UtilityHelper = {
  isMainnet: (chainId) => {
    if (chainId === 1) {
      return true;
    }
  },
};

export const isValidUrl = urlString=> {
  var urlPattern = new RegExp('^(https:\\/\\/)'+ // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

export const IPFSupload = async (input) => {
  input = Buffer.from(input);
  const projectId = process.env.REACT_APP_IPFS_PROJECT_ID;
  const projectSecret = process.env.REACT_APP_IPFS_PROJECT_SECRET;
  const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

  const client = ipfsClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    apiPath: '/api/v0/add',
    headers: {
      authorization: auth
    }
  });

  const storagePointer = await client.add(input, {pin: true});
  return storagePointer[0]['hash'];
}

export default UtilityHelper;
