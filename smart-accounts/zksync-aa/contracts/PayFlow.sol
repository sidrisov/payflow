// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract PayFlow {
  address public owner;

  event Withdrawn(address indexed to, uint256 indexed amount);

  constructor(address _owner) {
    owner = _owner;
  }

  function withdraw(uint256 amount) external {
    require(owner == msg.sender, "Withdrawal unauthorized");

    uint256 balance = address(this).balance;
    require(amount <= balance, "Withdrawal amount exceeds the balance!");
    (bool sent, ) = payable(owner).call{value: amount}("");
    require(sent, "Failed to withdraw Ether");

    emit Withdrawn(owner, amount);
  }

  receive() external payable {
    // If the contract is called directly, behave like an EOA.
    // Note, that is okay if the bootloader sends funds with no calldata as it may be used for refunds/operator payments
  }
}
