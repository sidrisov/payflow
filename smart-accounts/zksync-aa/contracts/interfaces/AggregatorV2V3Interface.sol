// taken from official chainlink repo: https://github.com/smartcontractkit/chainlink/tree/master/contracts/src/v0.8/interfaces

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AggregatorInterface.sol";
import "./AggregatorV3Interface.sol";

interface AggregatorV2V3Interface is AggregatorInterface, AggregatorV3Interface {}
