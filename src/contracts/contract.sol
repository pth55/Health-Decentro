
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HealthRecordContract {
    struct File {
        string name;
        string cid;
        string category;
        uint256 timestamp;
        string description;
    }

    struct DailyReport {
        uint256 timestamp;
        uint16 bloodPressureSystolic;
        uint16 bloodPressureDiastolic;
        uint16 bloodSugar;
        uint16 heartRate;
    }

    address public admin;
    
    // Mappings
    mapping(address => bool) public patients;
    mapping(address => bool) public doctors;
    mapping(address => mapping(address => bool)) private patientDoctorAccess;
    mapping(address => File[]) private patientFiles;
    mapping(address => DailyReport[]) private patientReports;
    mapping(address => address[]) private patientDoctors;
    mapping(address => address[]) private doctorPatients;

    // Events
    event PatientRegistered(address patient);
    event DoctorRegistered(address doctor);
    event FileAdded(address patient, string cid);
    event DailyReportAdded(address patient, uint256 timestamp);
    event AccessGranted(address patient, address doctor);
    event AccessRevoked(address patient, address doctor);

    constructor() {
        admin = msg.sender;
    }

    // Registration functions
    
    function registerPatient() public {
        require(!patients[msg.sender] && !doctors[msg.sender], "Already registered");
        patients[msg.sender] = true;
        emit PatientRegistered(msg.sender);
    }

    function registerDoctor() public {
        require(!doctors[msg.sender] && !patients[msg.sender], "Already registered");
        doctors[msg.sender] = true;
        emit DoctorRegistered(msg.sender);
    }

    // Admin functions
    function adminRegisterPatient(address patient) public {
        require(msg.sender == admin, "Only admin can call this");
        require(!patients[patient] && !doctors[patient], "Already registered");
        patients[patient] = true;
        emit PatientRegistered(patient);
    }

    function adminRegisterDoctor(address doctor) public {
        require(msg.sender == admin, "Only admin can call this");
        require(!doctors[doctor] && !patients[doctor], "Already registered");
        doctors[doctor] = true;
        emit DoctorRegistered(doctor);
    }

    // Role checking functions
    function isPatient(address addr) public view returns (bool) {
        return patients[addr];
    }

    function isDoctor(address addr) public view returns (bool) {
        return doctors[addr];
    }

    // File management
    function addFile(
        string memory name,
        string memory cid,
        string memory category,
        string memory description
    ) public {
        require(patients[msg.sender], "Only patients can add files");
        
        File memory newFile = File({
            name: name,
            cid: cid,
            category: category,
            timestamp: block.timestamp,
            description: description
        });
        
        patientFiles[msg.sender].push(newFile);
        emit FileAdded(msg.sender, cid);
    }

    // Daily report management
    function addDailyReport(
        uint16 bloodPressureSystolic,
        uint16 bloodPressureDiastolic,
        uint16 bloodSugar,
        uint16 heartRate
    ) public {
        require(patients[msg.sender], "Only patients can add reports");
        
        DailyReport memory newReport = DailyReport({
            timestamp: block.timestamp,
            bloodPressureSystolic: bloodPressureSystolic,
            bloodPressureDiastolic: bloodPressureDiastolic,
            bloodSugar: bloodSugar,
            heartRate: heartRate
        });
        
        patientReports[msg.sender].push(newReport);
        emit DailyReportAdded(msg.sender, block.timestamp);
    }

    // Access management
    function grantAccess(address doctorAddress) public {
        require(patients[msg.sender], "Only patients can grant access");
        require(doctors[doctorAddress], "Address is not a registered doctor");
        require(!patientDoctorAccess[msg.sender][doctorAddress], "Access already granted");
        
        patientDoctorAccess[msg.sender][doctorAddress] = true;
        patientDoctors[msg.sender].push(doctorAddress);
        doctorPatients[doctorAddress].push(msg.sender);
        
        emit AccessGranted(msg.sender, doctorAddress);
    }

    function revokeAccess(address doctorAddress) public {
        require(patients[msg.sender], "Only patients can revoke access");
        require(patientDoctorAccess[msg.sender][doctorAddress], "Access not granted");
        
        patientDoctorAccess[msg.sender][doctorAddress] = false;
        emit AccessRevoked(msg.sender, doctorAddress);
        
        // Note: We don't remove from arrays to avoid gas costs, just set the access to false
    }

    // Data retrieval functions
    function getFiles(address patientAddress) public view returns (File[] memory) {
        require(
            msg.sender == patientAddress || 
            patientDoctorAccess[patientAddress][msg.sender],
            "Not authorized to view files"
        );
        
        return patientFiles[patientAddress];
    }

    function getDailyReports(address patientAddress) public view returns (DailyReport[] memory) {
        require(
            msg.sender == patientAddress || 
            patientDoctorAccess[patientAddress][msg.sender],
            "Not authorized to view reports"
        );
        
        return patientReports[patientAddress];
    }

    function getDoctorAccess(address patientAddress, address doctorAddress) public view returns (bool) {
        return patientDoctorAccess[patientAddress][doctorAddress];
    }

    function getPatientDoctors(address patientAddress) public view returns (address[] memory) {
        require(
            msg.sender == patientAddress,
            "Not authorized to view patient doctors"
        );
        
        return patientDoctors[patientAddress];
    }

    function getDoctorPatients(address doctorAddress) public view returns (address[] memory) {
        require(
            msg.sender == doctorAddress,
            "Not authorized to view doctor patients"
        );
        
        return doctorPatients[doctorAddress];
    }
}