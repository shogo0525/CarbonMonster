// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IOffsetHelper {
    function autoOffsetUsingPoolToken(address _poolToken, uint256 _amountToOffset) external returns (address[] memory tco2s, uint256[] memory amounts);
}

struct Monster {
    uint256 birthTime;
    uint256 lastFeedTime;
}

library MonsterLib {
    uint256 private constant MAX_LIFE = 100;

    uint256 private constant ONE_HOUR = 1 hours / 100; // = 36sec, for test (100x speed)
    // uint256 private constant ONE_HOUR = 1 hours; // for production

    function isLifeLessThanHalf(uint256 life) internal pure returns (bool) {
        return life < MAX_LIFE / 2;
    }

    function getLife(Monster storage m) internal view returns (uint256) {
        int256 life = int256(MAX_LIFE) - int256((block.timestamp - m.lastFeedTime) / ONE_HOUR);
        return life <= 0 ? 0 : uint256(life);
    }

    function isAlive(Monster storage m) internal view returns (bool) {
        return getLife(m) > 0;
    }

    function getAge(Monster storage m) internal view returns (uint256) {
        if (isAlive(m)) {
            return (block.timestamp - m.birthTime) / ONE_HOUR;
        } else {
            return (m.lastFeedTime - m.birthTime) / ONE_HOUR + MAX_LIFE; // age at death
        }
    }

    function getHoursAfterDeath(Monster storage m) internal view returns (uint256) {
        return (block.timestamp - m.lastFeedTime) / ONE_HOUR - MAX_LIFE;
    }
}

contract CarbonMonster is Ownable, ERC721Enumerable {
    using Strings for uint256;
    using Counters for Counters.Counter;
    using MonsterLib for Monster;

    uint256 constant MAX_MINT = 10;

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => uint256) private _totalFeededAmount;

    mapping(string => address) public feedableTokenAddresses;
    mapping(uint256 => Monster) public monsters;
    address public offsetHelper;

    event MonsterUpdated(
        address indexed from,
        uint256 id,
        string image,
        uint256 totalFeededAmount
    );

    constructor() ERC721("Carbon Monster", "CM") {
        offsetHelper = 0x30dC279166DCFB69F52C91d6A3380dCa75D0fCa7;
        feedableTokenAddresses["BCT"] = 0xf2438A14f668b1bbA53408346288f3d7C71c10a1;
    }

    function mint() external {
        require(balanceOf(msg.sender) < MAX_MINT, 'no more mint');
        uint256 _tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        Monster storage m = monsters[_tokenId];
        m.birthTime = block.timestamp;
        m.lastFeedTime = block.timestamp;

        _safeMint(msg.sender, _tokenId);
        _emitMonsterUpdated(_tokenId);
    }

    function feed(uint256 tokenId, address feedToken, uint256 amount) external {
        require(_exists(tokenId), "no token");
        require(_isFeedable(feedToken), "Token not feedable");

        Monster storage m = monsters[tokenId];
        require(m.isAlive(), "already dead");
        m.lastFeedTime = block.timestamp;

        IERC20(feedToken).transferFrom(msg.sender, address(this), amount);
        IERC20(feedToken).approve(offsetHelper, amount);
        IOffsetHelper(offsetHelper).autoOffsetUsingPoolToken(feedToken, amount);

        _totalFeededAmount[tokenId] += amount;
        _emitMonsterUpdated(tokenId);
    }

    function _emitMonsterUpdated(uint256 tokenId) private {
        string memory svg;
        uint256 totalFeededAmount;
        (svg,,,,,totalFeededAmount) = getMonster(tokenId);
        emit MonsterUpdated(msg.sender, tokenId, svg, totalFeededAmount);
    }

    function _isFeedable(address feedToken) private view returns (bool) {
        if (feedToken == feedableTokenAddresses["BCT"]) return true;
        if (feedToken == feedableTokenAddresses["NCT"]) return true;
        return false;
    }

    function getMonster(uint256 tokenId) public view returns (
            string memory svg,
            bool isAlive,
            uint256 life,
            uint256 age,
            uint256 timestamp,
            uint256 totalFeededAmount
        )
    {
        require(_exists(tokenId), "no token");
        Monster storage m = monsters[tokenId];
        svg = _getMonsterSvg(tokenId);
        isAlive = m.isAlive();
        life = m.getLife();
        age = m.getAge();
        timestamp = block.timestamp;
        totalFeededAmount = _totalFeededAmount[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory svg = _getSvg(tokenId);
        bytes memory json = abi.encodePacked(
            '{"name": "Carbon Monster #',
            tokenId.toString(),
            '",',
            '"description": "This is a full on-chain experimental NFT. The monster you have created will only last 100 hours if you do not feed it. Please take care of it for a long time. created by shogosu (@shogo0525)",',
            '"image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '"}'
        );
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }

    function _getMonsterSvg(uint256 tokenId) private view returns (string memory) {
        require(_exists(tokenId), "no token");

        string memory svg = _getSvg(tokenId);
        return string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );
    }

    function _getSvg(uint256 tokenId) private view returns (string memory) {
        Monster storage m = monsters[tokenId];
        return m.isAlive() ? _getAliveSvg(_totalFeededAmount[tokenId]) : _getDeadSvg();
    }

    function _getDeadSvg() private pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">',
                '<circle style="fill: red" cx="500" cy="500" r="10" />',
                '</svg>'
            )
        );
    }

    function _getAliveSvg(uint256 totalFeededAmount) private pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">',
                '<circle style="fill: limegreen" cx="500" cy="500" r="',
                ((totalFeededAmount * 100 / 10**18) + 10).toString(),
                '" />',
                '</svg>'
            )
        );
    }

    // ----------------------------------------
    //  Admin methods
    // ----------------------------------------

    function setFeedableTokenAddress(string memory tokenSymbol, address tokenAddress) public virtual onlyOwner {
        feedableTokenAddresses[tokenSymbol] = tokenAddress;
    }

    function deleteFeedableTokenAddress(string memory tokenSymbol) public virtual onlyOwner {
        delete feedableTokenAddresses[tokenSymbol];
    }

    function setOffsetHelper(address contractAddress) external onlyOwner {
        offsetHelper = contractAddress;
    }
}
