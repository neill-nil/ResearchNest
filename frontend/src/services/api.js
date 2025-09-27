// --- MOCK DATABASE HELPERS ---
const getDb = () => {
    const db = localStorage.getItem('mockResearchNestDb');
    if (!db) {
        const defaultDb = {
          student123: {
            id: "student123", // Internal unique ID
            studentId: "S2022001", // Public-facing Student ID
            email: "student@example.com",
            name: "Jane Doe (Default)",
            role: "student",
            milestones: [
              { id: "m1", title: "Course Completion", status: "In Progress", stages: [
                  { id: "s1_1", title: "Research Methods", status: "In Progress", tasks: [
                      { id: "t1_1_1", title: "Research Paper Submission", status: "In Progress", subtasks: [
                          { id: "st1_1_1_1", title: "Draft Abstract", status: "Completed" },
                          { id: "st1_1_1_2", title: "Collect References", status: "In Progress" },
                        ],
                      },
                      { id: "t1_1_2", title: "Tutorial Presentation", status: "Locked", subtasks: [] },
                    ],
                  },
                ],
              },
            ],
          },
        };
        saveDb(defaultDb);
        return defaultDb;
    }
    return JSON.parse(db);
};

const saveDb = (db) => {
    localStorage.setItem('mockResearchNestDb', JSON.stringify(db));
};

// --- API FUNCTIONS ---
export const registerUser = (userData) => {
  const db = getDb();

  const emailExists = Object.values(db).some(user => user.email === userData.email);
  if (emailExists) {
    return { success: false, user: null, message: "An account with this email already exists." };
  }


  if (userData.role === 'student') {
      const studentIdExists = Object.values(db).some(user => user.studentId === userData.studentId);
      if (studentIdExists) {
          return { success: false, user: null, message: "This Student ID is already registered."};
      }
  }

  const newInternalId = `user_${Date.now()}`;
  const newUser = {
    id: newInternalId, 
    studentId: userData.role === 'student' ? userData.studentId : null, 
    email: userData.email,
    name: userData.name,
    role: userData.role,
    milestones: [ { id: "m1_new", title: "Initial Onboarding", status: "In Progress", stages: [
          { id: "s1_1_new", title: "Account Setup", status: "In Progress", tasks: [
              { id: "t1_1_1_new", title: "Complete Your Profile Information", status: "In Progress", subtasks: [] },
              { id: "t1_1_2_new", title: "Review University Guidelines", status: "Locked", subtasks: [] }
            ]
          }
        ]
      }
    ]
  };

  db[newInternalId] = newUser;
  saveDb(db);
  
  return { success: true, user: newUser, message: "Registration successful." };
};

export const getUserByEmail = (email) => {
    const db = getDb();
    return Object.values(db).find(user => user.email === email) || null;
}

export const getAllStudents = () => {
    const db = getDb();
    const students = Object.values(db).filter(user => user.role === 'student');
    
    return students.map(student => ({ 
        id: student.id,
        studentId: student.studentId, 
        name: student.name 
    }));
};

export const getStudentDataByEmail = (email) => {
    const student = getUserByEmail(email);
    if (!student || student.role !== 'student') return null;
    return JSON.parse(JSON.stringify(student));
};

export const getStudentDataById = (studentId) => {
    const db = getDb();
    const student = db[studentId];
    if (!student) return null;
    return JSON.parse(JSON.stringify(student));
};

export const updateStudentData = (studentId, path, newStatus) => {
  const db = getDb();
  let student = db[studentId];
  if (!student) return null;
  let item;
  if (path.subtaskIndex !== undefined) item = student.milestones[path.milestoneIndex].stages[path.stageIndex].tasks[path.taskIndex].subtasks[path.subtaskIndex];
  else if (path.taskIndex !== undefined) item = student.milestones[path.milestoneIndex].stages[path.stageIndex].tasks[path.taskIndex];
  if (item) item.status = newStatus;
  recalculateAllStatuses(student);
  saveDb(db);
  return JSON.parse(JSON.stringify(student));
};

export const overrideMilestoneStatus = (studentId, path) => {
    const db = getDb();
    let student = db[studentId];
    if (!student) return null;
    const { milestoneIndex } = path;
    const milestone = student.milestones[milestoneIndex];
    if (milestone) {
        milestone.status = "Completed";
        milestone.stages.forEach(stage => {
            stage.status = "Completed";
            stage.tasks.forEach(task => task.status = "Completed");
        });
    }
    recalculateAllStatuses(student);
    saveDb(db);
    return JSON.parse(JSON.stringify(student));
};

const calculateParentStatus = (children) => {
  if (!children || children.length === 0) return "Completed";
  if (children.every((child) => child.status === "Completed")) return "Completed";
  if (children.some((child) => child.status === "In Progress" || child.status === "Completed")) return "In Progress";
  return "Locked";
};

const recalculateAllStatuses = (student) => {
  student.milestones.forEach((milestone) => {
    milestone.stages.forEach((stage) => {
      stage.tasks.forEach((task) => {
        if (task.subtasks && task.subtasks.length > 0) task.status = calculateParentStatus(task.subtasks);
      });
      stage.status = calculateParentStatus(stage.tasks);
    });
    milestone.status = calculateParentStatus(milestone.stages);
  });
};

