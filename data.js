// Data Storage Management
const DB_NAME = "hostel_ease_db";

const initialData = {
    rooms: [
        { id: 1, number: "101", type: "Single", capacity: 1, occupied: 1, status: "Occupied" },
        { id: 2, number: "102", type: "Shared", capacity: 2, occupied: 1, status: "Available" },
        { id: 3, number: "103", type: "Shared", capacity: 3, occupied: 0, status: "Available" },
        { id: 4, number: "201", type: "Single", capacity: 1, occupied: 0, status: "Available" },
    ],
    students: [
        { id: 1, rollNo: "STUD-2024-001", name: "Ahmed Khan", dept: "Computer Science", room: "101", phone: "0300-1234567", guardian: "0300-7654321", feeStatus: "Paid" },
        { id: 2, rollNo: "STUD-2024-002", name: "Sara Ali", dept: "Electrical Engineering", room: "102", phone: "0300-9998887", guardian: "0300-1112223", feeStatus: "Due" },
    ],
    complaints: [
        { id: 1, studentId: "STUD-2024-001", category: "Electrical", desc: "Fan not working in room 101", status: "Pending", date: "2024-03-20" },
    ],
    notices: [
        { id: 1, title: "Hostel Fee Deadline", desc: "Please pay your fees by the 5th of next month.", priority: "High", date: "2024-03-25" },
        { id: 2, title: "Maintenance Schedule", desc: "Block A will have a water outage for 2 hours tomorrow.", priority: "Medium", date: "2024-03-26" },
    ],
    attendance: [
        { date: "2024-03-28", records: [{ rollNo: "STUD-2024-001", status: "Present" }, { rollNo: "STUD-2024-002", status: "Absent" }] }
    ]
};

// Initialize DB if not exists
function initDB() {
    if (!localStorage.getItem(DB_NAME)) {
        localStorage.setItem(DB_NAME, JSON.stringify(initialData));
    }
}

function getData() {
    return JSON.parse(localStorage.getItem(DB_NAME));
}

function saveData(data) {
    localStorage.setItem(DB_NAME, JSON.stringify(data));
}

// Helper methods
const Storage = {
    getAll: (key) => getData()[key],
    
    add: (key, item) => {
        const data = getData();
        item.id = Date.now();
        data[key].push(item);
        saveData(data);
        return item;
    },

    update: (key, id, updatedItem) => {
        const data = getData();
        const index = data[key].findIndex(i => i.id == id || i.rollNo == id);
        if (index !== -1) {
            data[key][index] = { ...data[key][index], ...updatedItem };
            saveData(data);
        }
    },

    delete: (key, id) => {
        const data = getData();
        data[key] = data[key].filter(i => i.id != id && i.rollNo != id);
        saveData(data);
    }
};

initDB();
