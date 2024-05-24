// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.9.0;

contract Election {
    // State variables
    address public admin;   // Address of the admin who deploys the contract
    uint256 candidateCount; // Counter to keep track of the number of candidates
    uint256 voterCount;     // Counter to keep track of the number of verified voters
    uint256 registerCount;  // Counter to keep track of the number of registered voters
    bool start;             // Flag to indicate the start of the election
    bool end;               // Flag to indicate the end of the election

    // Constructor to initialize default values
    constructor() public {
        admin = msg.sender; // Set the admin as the address that deploys the contract
        candidateCount = 0; // Initialize candidate count to 0
        voterCount = 0;     // Initialize voter count to 0
        registerCount = 0;  // Initialize register count to 0
        start = false;      // Election has not started
        end = false;        // Election has not ended
    }

    // Function to get the admin address
    function getAdmin() public view returns (address) {
        return admin;       // Return the admin address
    }

    // Modifier to restrict access to only admin
    modifier onlyAdmin() {
        require(msg.sender == admin); // Ensure the caller is the admin
        _;                            // Continue with the rest of the function
    }

    // Struct to model a candidate
    struct Candidate {
        uint256 candidateId; // Unique ID for the candidate
        string header;       // Candidate's name or header
        string slogan;       // Candidate's slogan
        uint256 voteCount;   // Number of votes the candidate has received
    }
    
    // Mapping to store candidate details based on their ID
    // mapping(key => value) <access specifier> <name>;
    mapping(uint256 => Candidate) public candidateDetails;

    // Function to add a new candidate (only admin can add)
    function addCandidate(string memory _header, string memory _slogan) public onlyAdmin {
        Candidate memory newCandidate = Candidate({
            candidateId: candidateCount, // Assign a new candidate ID
            header: _header,            // Set candidate's header
            slogan: _slogan,            // Set candidate's slogan
            voteCount: 0                // Initialize vote count to 0
        });
        candidateDetails[candidateCount] = newCandidate; // Store candidate details in the mapping
        candidateCount += 1; // Increment the candidate count
    }

    // Struct to model election details
    struct ElectionDetails {
        string adminName;       // Admin's name
        string adminEmail;      // Admin's email
        string adminTitle;      // Admin's title
        string electionTitle;   // Election title
        string organizationTitle; // Organization title
    }
    
    // Variable to store election details
    ElectionDetails electionDetails;

    // Function to set election details (only admin can set)
    function setElectionDetails(
        string memory _adminName,
        string memory _adminEmail,
        string memory _adminTitle,
        string memory _electionTitle,
        string memory _organizationTitle
    ) public onlyAdmin {
        electionDetails = ElectionDetails(
            _adminName,         // Set admin name
            _adminEmail,        // Set admin email
            _adminTitle,        // Set admin title
            _electionTitle,     // Set election title
            _organizationTitle  // Set organization title
        );
        start = true; // Start the election
        end = false; // Ensure the election has not ended
    }

    // Function to get election details
    function getElectionDetails()
        public
        view
        returns (
            string memory adminName,
            string memory adminEmail,
            string memory adminTitle,
            string memory electionTitle,
            string memory organizationTitle
        )
    {
        return (
            electionDetails.adminName, // Return admin name
            electionDetails.adminEmail, // Return admin email
            electionDetails.adminTitle, // Return admin title
            electionDetails.electionTitle, // Return election title
            electionDetails.organizationTitle // Return organization title
        );
    }

    // Function to get the total number of candidates
    function getTotalCandidate() public view returns (uint256) {
        return candidateCount; // Return the candidate count
    }

    // Function to get the total number of voters
    function getTotalVoter() public view returns (uint256) {
        return voterCount; // Return the voter count
    }

    // Function to get the total number of registered voters
    function getRegisterVoter() public view returns (uint256) {
        return registerCount; // Return the register count
    }

    // Struct to model a voter
    struct Voter {
        address voterAddress; // Voter's address
        string name; // Voter's name
        string phone; // Voter's phone number
        string aadhar; // Voter's Aadhar number (unique identifier)
        bool isVerified; // Flag to indicate if the voter is verified
        bool hasVoted; // Flag to indicate if the voter has voted
        bool isRegistered; // Flag to indicate if the voter is registered
    }

    // Array to store the addresses of voters
    address[] public voters;
    
    // Mapping to store voter details based on their address
    mapping(address => Voter) public voterDetails;

    // Function to register as a voter
    function registerAsVoter(string memory _name, string memory _phone, string memory _aadhar) public {
        Voter memory newVoter = Voter({
            voterAddress: msg.sender, // Set the voter's address
            name: _name, // Set voter's name
            phone: _phone, // Set voter's phone number
            aadhar: _aadhar, // Set voter's Aadhar number
            hasVoted: false, // Initialize hasVoted to false
            isVerified: false, // Initialize isVerified to false
            isRegistered: true // Set isRegistered to true
        });
        voterDetails[msg.sender] = newVoter; // Store voter details in the mapping
        voters.push(msg.sender); // Add voter's address to the array
        registerCount += 1; // Increment the register count
    }

    // Function to check if a voter with the same Aadhar card number already exists
    function isAadharRegistered(string memory _aadhar) public view returns (bool) {
        for (uint i = 0; i < voters.length; i++) {
            if (keccak256(abi.encodePacked(voterDetails[voters[i]].aadhar)) == keccak256(abi.encodePacked(_aadhar))) {
                return true; // Return true if Aadhar number is already registered
            }
        }
        return false; // Return false if Aadhar number is not registered
    }

    // Function to verify a voter (only admin can verify)
    function verifyVoter(bool _verifedStatus, address voterAddress) public onlyAdmin {
        voterDetails[voterAddress].isVerified = _verifedStatus; // Set the verified status of the voter
        voterCount += 1; // Increment the voter count
    }

    // Function to cast a vote
    function vote(uint256 candidateId) public {
        require(voterDetails[msg.sender].hasVoted == false); // Ensure the voter has not already voted
        require(voterDetails[msg.sender].isVerified == true); // Ensure the voter is verified
        require(start == true);                             // Ensure the election has started
        require(end == false);                              // Ensure the election has not ended
        candidateDetails[candidateId].voteCount += 1;       // Increment the vote count of the candidate
        voterDetails[msg.sender].hasVoted = true;           // Mark the voter as having voted
    }

    // Function to end the election (only admin can end)
    function endElection() public onlyAdmin {
        end = true; // Set the end flag to true
        start = false; // Set the start flag to false
    }

    // Function to get the start status of the election
    function getStart() public view returns (bool) {
        return start; // Return the start status
    }

    // Function to get the end status of the election
    function getEnd() public view returns (bool) {
        return end; // Return the end status
    }
}