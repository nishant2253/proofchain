// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
  function decimals() external view returns (uint8);
  function description() external view returns (string memory);
  function version() external view returns (uint256);
  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract MockAggregatorV3 is AggregatorV3Interface {
    int256 public answer;
    uint8 public constant DECIMALS = 8;

    constructor(int256 _answer) {
        answer = _answer;
    }

    function decimals() external pure override returns (uint8) {
        return DECIMALS;
    }

    function description() external pure override returns (string memory) {
        return "Mock ETH/USD Price Feed";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(
        uint80 _roundId
    ) external view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return (_roundId, answer, block.timestamp, block.timestamp, _roundId);
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (1, answer, block.timestamp, block.timestamp, 1);
    }

    function updateAnswer(int256 _newAnswer) external {
        answer = _newAnswer;
    }
}
