import { useRef, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import { getAddress } from "viem";
import { Address } from "viem";
import { useDisconnect } from "wagmi";
import {
  ArrowLeftOnRectangleIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  UserIcon
  
} from "@heroicons/react/24/outline";
import { BlockieAvatar, isENS } from "~~/components/scaffold-eth";
import { useCopyToClipboard, useOutsideClick } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
};

export const AddressInfoDropdown = ({
  address,
  ensAvatar,
  displayName,
  // blockExplorerAddressLink,
}: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const checkSumAddress = getAddress(address);

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };

  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <>
      <details ref={dropdownRef} className="dropdown dropdown-end">
        <summary className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 cursor-pointer shadow-md hover:bg-zinc-800 transition">
          <BlockieAvatar address={checkSumAddress} size={30} ensImage={ensAvatar} />
          <span className="text-sm font-medium text-white">
            {isENS(displayName) ? displayName : `${checkSumAddress?.slice(0, 6)}...${checkSumAddress?.slice(-4)}`}
          </span>
          <ChevronDownIcon className="h-5 w-5 text-white" />
        </summary>

        <ul className="dropdown-content mt-2 w-64 bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl z-[1] text-white space-y-2">
          <NetworkOptions hidden={!selectingNetwork} />

          {!selectingNetwork && (
            <>
              <li>
                <a
                  href="/profile"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition"
                >
                  <UserIcon className="h-5 w-5 text-zinc-300" />
                  <span>My Persona</span>
                </a>
              </li>
              <li>
                <button
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg w-full transition"
                  onClick={() => copyAddressToClipboard(checkSumAddress)}
                >
                  {isAddressCopiedToClipboard ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="h-5 w-5 text-zinc-300" />
                      <span>Copy address</span>
                    </>
                  )}
                </button>
              </li>

              {/* <li>
                <label
                  htmlFor="qrcode-modal"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg cursor-pointer transition"
                >
                  <QrCodeIcon className="h-5 w-5 text-zinc-300" />
                  <span>View QR Code</span>
                </label>
              </li> */}

              {/* <li>
                <a
                  href={blockExplorerAddressLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 text-zinc-300" />
                  <span>View on Block Explorer</span>
                </a>
              </li> */}

              {allowedNetworks.length > 1 && (
                <li>
                  <button
                    className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg w-full transition"
                    onClick={() => setSelectingNetwork(true)}
                  >
                    <ArrowsRightLeftIcon className="h-5 w-5 text-zinc-300" />
                    <span>Switch Network</span>
                  </button>
                </li>
              )}

              <li>
                <button
                  className="flex items-center gap-3 px-3 py-2 hover:bg-red-600 hover:text-white rounded-lg w-full text-red-500 transition"
                  onClick={() => disconnect()}
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                  <span>Disconnect</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </details>

    </>
  );
};
