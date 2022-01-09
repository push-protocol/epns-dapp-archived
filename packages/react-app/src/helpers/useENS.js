import { useWeb3React} from '@web3-react/core'
import { ethers } from "ethers";
import { useEffect, useState } from "react";

const useENS = () => {
  const [ensName, setENSName] = useState(null);
  const [loading, setLoading] = useState(false);
  const { account } = useWeb3React();

  useEffect(() => {
    const resolveENS = async () => {
      setLoading(true);
      if (account && ethers.utils.isAddress(account)) {
        try {
        const provider = new ethers.providers.getDefaultProvider();
          const ensName = await provider.lookupAddress(account);
          if(ensName) setENSName(ensName);
        } finally {
          setLoading(false);
        }
      }
    };
    resolveENS();
  }, [account]);

  return { ensName, loading };
};

export default useENS;