// PokerChipManager Smart Contract - Bytecode & ABI
// Compiled from docs/contracts/PokerChipManager.sol
// Network: Over Protocol Mainnet (Chain ID: 54176)

// WOVER Token Address (constructor argument)
export const WOVER_TOKEN_ADDRESS = '0x59c914C8ac6F212bb655737CC80d9Abc79A1e273' as `0x${string}`;

// Contract Bytecode for deployment
export const POKER_CHIP_MANAGER_BYTECODE = '0x60a060405234801561001057600080fd5b506040516110c93803806110c983398101604081905261002f916100c4565b338061005557604051631e4fbdf760e01b81526000600482015260240160405180910390fd5b61005e81610074565b50600180556001600160a01b03166080526100f4565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6000602082840312156100d657600080fd5b81516001600160a01b03811681146100ed57600080fd5b9392505050565b608051610fac61011d60003960008181610388015281816105a901526109920152610fac6000f3fe608060405234801561001057600080fd5b506004361061014d5760003560e01c80638da5cb5b116100c3578063bc7d853c1161007c578063bc7d853c1461033a578063c0b70b311461034d578063d0d6d0e314610360578063debf448314610383578063e1e158a514610207578063f2fde38b146103aa57600080fd5b80638da5cb5b146102915780639a146a15146102b6578063b074ba5a146102c9578063b287d8ca146102dc578063b5012b3b146102ef578063b5e363001461031a57600080fd5b80633f118e9b116101155780633f118e9b146102075780635c7b79f5146102155780635eaef27b14610228578063715018a61461023b57806371e018791461024357806373fa9d251461026357600080fd5b8063029eb0b114610152578063051036b61461018e57806322977b83146101b7578063245887e6146101ea57806331a3b7a1146101f2575b600080fd5b61017b610160366004610cc9565b6001600160a01b031660009081526003602052604090205490565b6040519081526020015b60405180910390f35b61017b61019c366004610cc9565b6001600160a01b031660009081526002602052604090205490565b6101da6101c5366004610ceb565b60056020526000908152604090205460ff1681565b6040519015158152602001610185565b61017b600181565b610205610200366004610d04565b6103bd565b005b61017b662386f26fc1000081565b610205610223366004610ceb565b6104d0565b610205610236366004610ceb565b610692565b6102056106b2565b61017b610251366004610cc9565b60036020526000908152604090205481565b610276610271366004610cc9565b6106c6565b60408051938452602084019290925290820152606001610185565b6000546001600160a01b03165b6040516001600160a01b039091168152602001610185565b6102056102c4366004610d39565b6106ff565b6102056102d7366004610db1565b6107b8565b6102056102ea366004610ceb565b61093d565b61017b6102fd366004610d39565b600460209081526000928352604080842090915290825290205481565b61017b610328366004610cc9565b60026020526000908152604090205481565b610205610348366004610d04565b610ac3565b61017b61035b366004610d39565b610b9c565b6101da61036e366004610ceb565b60009081526005602052604090205460ff1690565b61029e7f000000000000000000000000000000000000000000000000000000000000000081565b6102056103b8366004610cc9565b610bc6565b6103c5610c06565b6001600160a01b0382166000908152600260205260409020548111156103fe5760405163819cc4c160e01b815260040160405180910390fd5b6001600160a01b03821660009081526002602052604081208054839290610426908490610e41565b909155505060008381526004602090815260408083206001600160a01b03861684529091528120805483929061045d908490610e54565b909155505060008381526005602052604090819020805460ff19166001179055516001600160a01b0383169084907f7af7c288c12e3d59f052fe3151e1dc20637551402a3f6d8ac578596c461f81c2906104c39085904290918252602082015260400190565b60405180910390a3505050565b6104d8610c33565b662386f26fc1000081101561050057604051630980da4560e11b815260040160405180910390fd5b336000908152600260205260409020548111156105305760405163819cc4c160e01b815260040160405180910390fd5b600061053d600183610e67565b33600090815260026020526040812080549293508492909190610561908490610e41565b90915550503360009081526003602052604081208054839290610585908490610e41565b909155505060405163a9059cbb60e01b8152336004820152602481018290526000907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03169063a9059cbb906044016020604051808303816000875af11580156105fa573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061061e9190610e89565b90508061063e576040516312171d8360e31b815260040160405180910390fd5b6040805183815260208101859052429181019190915233907f650fdf669e93aa6c8ff3defe2da9c12b64f1548e5e1e54e803f4c1beb6466c8e906060015b60405180910390a2505061068f60018055565b50565b61069a610c06565b6000908152600560205260409020805460ff19169055565b6106ba610c06565b6106c46000610c5d565b565b6001600160a01b038116600090815260026020908152604080832054600390925282205490916106f7600184610e67565b929491935050565b610707610c06565b60008281526004602090815260408083206001600160a01b038516845290915290205480156107b35760008381526004602090815260408083206001600160a01b0386168452825280832083905560029091528120805483929061076c908490610e54565b9091555050604080518281524260208201526001600160a01b0384169185917f04f73e69cb5426268ac01695defb2e354220d50b350120bbed078807087a1e7a91016104c3565b505050565b6107c0610c06565b60008581526005602052604090205460ff166107ef5760405163563e901160e01b815260040160405180910390fd5b82811461080f57604051634ec4810560e11b815260040160405180910390fd5b60005b838110156108f55760008681526004602052604081208187878581811061083b5761083b610eab565b90506020020160208101906108509190610cc9565b6001600160a01b0316815260208101919091526040016000205582828281811061087c5761087c610eab565b905060200201356002600087878581811061089957610899610eab565b90506020020160208101906108ae9190610cc9565b6001600160a01b03166001600160a01b0316815260200190815260200160002060008282546108dd9190610e54565b909155508190506108ed81610ec1565b915050610812565b50847f77cd6d4bf20b2152d8405f675ce933d5d70ad568b4d9b98c8971fef07069414c858585854260405161092e959493929190610eda565b60405180910390a25050505050565b610945610c33565b662386f26fc1000081101561096d57604051632ddf431160e11b815260040160405180910390fd5b6040516323b872dd60e01b8152336004820152306024820152604481018290526000907f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316906323b872dd906064016020604051808303816000875af11580156109e3573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a079190610e89565b905080610a27576040516312171d8360e31b815260040160405180910390fd5b6000610a34600184610f5f565b33600090815260026020526040812080549293508392909190610a58908490610e54565b90915550503360009081526003602052604081208054859290610a7c908490610e54565b90915550506040805184815260208101839052429181019190915233907f36af321ec8d3c75236829c5317affd40ddb308863a1236d2d277a4025cccee1e9060600161067c565b610acb610c06565b60008381526005602052604090205460ff16610afa5760405163563e901160e01b815260040160405180910390fd5b60008381526004602090815260408083206001600160a01b0386168452909152902054811115610b3d5760405163819cc4c160e01b815260040160405180910390fd5b60008381526004602090815260408083206001600160a01b038616845290915281208054839290610b6f908490610e41565b90915550506001600160a01b0382166000908152600260205260408120805483929061076c908490610e54565b60008281526004602090815260408083206001600160a01b03851684529091529020545b92915050565b610bce610c06565b6001600160a01b038116610bfd57604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b61068f81610c5d565b6000546001600160a01b031633146106c45760405163118cdaa760e01b8152336004820152602401610bf4565b600260015403610c5657604051633ee5aeb560e01b815260040160405180910390fd5b6002600155565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b80356001600160a01b0381168114610cc457600080fd5b919050565b600060208284031215610cdb57600080fd5b610ce482610cad565b9392505050565b600060208284031215610cfd57600080fd5b5035919050565b600080600060608486031215610d1957600080fd5b83359250610d2960208501610cad565b9150604084013590509250925092565b60008060408385031215610d4c57600080fd5b82359150610d5c60208401610cad565b90509250929050565b60008083601f840112610d7757600080fd5b50813567ffffffffffffffff811115610d8f57600080fd5b6020830191508360208260051b8501011115610daa57600080fd5b9250929050565b600080600080600060608688031215610dc957600080fd5b85359450602086013567ffffffffffffffff80821115610de857600080fd5b610df489838a01610d65565b90965094506040880135915080821115610e0d57600080fd5b50610e1a88828901610d65565b969995985093965092949392505050565b634e487b7160e01b600052601160045260246000fd5b81810381811115610bc057610bc0610e2b565b80820180821115610bc057610bc0610e2b565b600082610e8457634e487b7160e01b600052601260045260246000fd5b500490565b600060208284031215610e9b57600080fd5b81518015158114610ce457600080fd5b634e487b7160e01b600052603260045260246000fd5b600060018201610ed357610ed3610e2b565b5060010190565b6060808252810185905260008660808301825b88811015610f1b576001600160a01b03610f0684610cad565b16825260209283019290910190600101610eed565b5083810360208501528581526001600160fb1b03861115610f3b57600080fd5b8560051b915081876020830137604093909301939093525001602001949350505050565b8082028115828204841417610bc057610bc0610e2b56fea2646970667358221220828599b68a618ec0b41d7eef51687c7ef6a0f88983cc58be8f05d1905f304a2164736f6c63430008140033' as `0x${string}`;

// Complete ABI for PokerChipManager contract
export const POKER_CHIP_MANAGER_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_woverToken', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'BelowMinimumDeposit', type: 'error' },
  { inputs: [], name: 'BelowMinimumWithdrawal', type: 'error' },
  { inputs: [], name: 'InsufficientBalance', type: 'error' },
  { inputs: [], name: 'InsufficientChips', type: 'error' },
  { inputs: [], name: 'InvalidArrayLength', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  { inputs: [], name: 'ReentrancyGuardReentrantCall', type: 'error' },
  { inputs: [], name: 'TableNotActive', type: 'error' },
  { inputs: [], name: 'TransferFailed', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'chips', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ChipsLockedToTable',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'chips', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ChipsUnlockedFromTable',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'woverAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'chipsGranted', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'Deposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { indexed: false, internalType: 'address[]', name: 'players', type: 'address[]' },
      { indexed: false, internalType: 'uint256[]', name: 'finalChips', type: 'uint256[]' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'GameSettled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'woverAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'chipsSpent', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'Withdrawal',
    type: 'event',
  },
  {
    inputs: [],
    name: 'CHIPS_PER_WOVER',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MIN_DEPOSIT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MIN_WITHDRAWAL_CHIPS',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'woverAmount', type: 'uint256' }],
    name: 'buyIn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'chipAmount', type: 'uint256' }],
    name: 'cashOut',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'chipBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'tableId', type: 'bytes32' }],
    name: 'deactivateTable',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { internalType: 'address', name: 'player', type: 'address' },
    ],
    name: 'emergencyUnlock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getLockedWover',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getPlayerChips',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getPlayerFullBalance',
    outputs: [
      { internalType: 'uint256', name: 'available', type: 'uint256' },
      { internalType: 'uint256', name: 'woverDeposited', type: 'uint256' },
      { internalType: 'uint256', name: 'woverEquivalent', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { internalType: 'address', name: 'player', type: 'address' },
    ],
    name: 'getTableChips',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'tableId', type: 'bytes32' }],
    name: 'isTableActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { internalType: 'address', name: 'player', type: 'address' },
      { internalType: 'uint256', name: 'chipAmount', type: 'uint256' },
    ],
    name: 'lockChipsToTable',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'lockedWover',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { internalType: 'address[]', name: 'players', type: 'address[]' },
      { internalType: 'uint256[]', name: 'finalChips', type: 'uint256[]' },
    ],
    name: 'settleGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'tableActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'tableChips',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'tableId', type: 'bytes32' },
      { internalType: 'address', name: 'player', type: 'address' },
      { internalType: 'uint256', name: 'chipAmount', type: 'uint256' },
    ],
    name: 'unlockChipsFromTable',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'woverToken',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Local storage key for contract address
export const CONTRACT_ADDRESS_KEY = 'poker_chip_manager_address';

// Get stored contract address
export function getStoredContractAddress(): `0x${string}` | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CONTRACT_ADDRESS_KEY);
  if (stored && stored.startsWith('0x') && stored.length === 42) {
    return stored as `0x${string}`;
  }
  return null;
}

// Set contract address in local storage
export function setStoredContractAddress(address: `0x${string}`) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONTRACT_ADDRESS_KEY, address);
  }
}
