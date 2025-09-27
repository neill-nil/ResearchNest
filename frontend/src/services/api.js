// --- MOCK DATABASE HELPERS ---

// Gets the database from localStorage or initializes it with default data
const getDb = () => {
    const db = localStorage.getItem('mockResearchNestDb');
    if (!db) {
        const defaultDb = {
          student123: {
            id: "student123",
            email: "student@example.com",
            name: "Jane Doe (Default)",
            role: "student",
            studentId: "S001",
            programme: "Ph.D. in AI",
            department: null,
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
                  { id: "s1_2", title: "Advanced Databases", status: "Locked", tasks: [{ id: "t1_2_1", title: "Assignment 1", status: "Locked", subtasks: [] }],
                  },
                ],
              },
              { id: "m2", title: "Thesis Submission", status: "Locked", stages: [
                  { id: "s2_1", title: "Proposal Approval", status: "Locked", tasks: [{ id: "t2_1_1", title: "Write Literature Review", status: "Locked", subtasks: [] }],
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

// Saves the entire database object to localStorage
const saveDb = (db) => {
    localStorage.setItem('mockResearchNestDb', JSON.stringify(db));
};

// --- API FUNCTIONS ---

export const registerUser = (userData) => {
  const db = getDb();

  if (Object.values(db).some(user => user.email === userData.email)) {
    return { success: false, message: "An account with this email already exists." };
  }
  if (userData.role === 'student' && Object.values(db).some(user => user.studentId === userData.studentId)) {
    return { success: false, message: "This Student ID is already taken." };
  }

  const newUserId = `user_${Date.now()}`;
  const newUser = {
    id: newUserId,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    studentId: userData.studentId || null,
    programme: userData.programme || null,
    department: userData.department || null,
    milestones: [
      { id: "m1_new", title: "Initial Onboarding", status: "In Progress", stages: [
          { id: "s1_1_new", title: "Account Setup", status: "In Progress", tasks: [
              { id: "t1_1_1_new", title: "Complete Your Profile Information", status: "In Progress", subtasks: [] },
              { id: "t1_1_2_new", title: "Review University Guidelines", status: "Locked", subtasks: [] }
            ]
          }
        ]
      }
    ]
  };

  db[newUserId] = newUser;
  saveDb(db);
  
  return { success: true, user: newUser, message: "Registration successful." };
};

export const getUserByEmail = (email) => {
    const db = getDb();
    return Object.values(db).find(user => user.email === email) || null;
}

export const getStudentDataByEmail = (email) => {
    const student = getUserByEmail(email);
    if (!student || student.role !== 'student') return null;
    return JSON.parse(JSON.stringify(student));
};

export const getStudentDataById = (studentId) => {
    const db = getDb();
    const student = db[studentId];
    return student ? JSON.parse(JSON.stringify(student)) : null;
}

export const getAllStudents = () => {
    const db = getDb();
    return Object.values(db).filter(user => user.role === 'student');
}

export const updateStudentData = (studentId, path, newStatus) => {
  const db = getDb();
  let student = db[studentId];
  if (!student) return null;

  let item;
  if (path.subtaskIndex !== undefined) {
    item = student.milestones[path.milestoneIndex].stages[path.stageIndex].tasks[path.taskIndex].subtasks[path.subtaskIndex];
  } else if (path.taskIndex !== undefined) {
    item = student.milestones[path.milestoneIndex].stages[path.stageIndex].tasks[path.taskIndex];
  }
  
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
            stage.tasks.forEach(task => {
                task.status = "Completed";
                task.subtasks.forEach(subtask => {
                    subtask.status = "Completed";
                });
            });
        });
    }

    recalculateAllStatuses(student);
    saveDb(db);
    return JSON.parse(JSON.stringify(student));
};

// --- HELPER LOGIC ---
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
        if (task.subtasks && task.subtasks.length > 0) {
          task.status = calculateParentStatus(task.subtasks);
        }
      });
      stage.status = calculateParentStatus(stage.tasks);
    });
    milestone.status = calculateParentStatus(milestone.stages);
  });
};

