const db = require('../../models');
const FacultyNote = db.FacultyNote;


exports.createNote = async (req, res) => {
    try {
        if (req.user.role !== "faculty") {
            return res.status(403).json({ message: "Only faculty can add notes" });
        }

        const { student_id, milestone_id, stage_id, task_id, subtask_id, note } = req.body;

        if (!note) {
            return res.status(400).json({ message: "Note text is required" });
        }

        const newNote = await FacultyNote.create({
            faculty_id: req.user.id, 
            student_id,
            milestone_id,
            stage_id,
            task_id,
            subtask_id,
            note
        });

        return res.status(201).json({ message: "Note added", note: newNote });
    } catch (err) {
        console.error("❌ Create note error:", err);
        return res.status(500).json({ message: "Failed to create note", error: err.message });
    }
};


exports.getNotesForStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const notes = await FacultyNote.findAll({
            where: { student_id: studentId }
        });

        return res.json(notes);
    } catch (err) {
        console.error("❌ Get notes error:", err);
        return res.status(500).json({ message: "Failed to fetch notes", error: err.message });
    }
};


exports.deleteNote = async (req, res) => {
    try {
        if (req.user.role !== "faculty") {
            return res.status(403).json({ message: "Only faculty can delete notes" });
        }

        const { id } = req.params;
        const note = await FacultyNote.findByPk(id);

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }


        if (note.faculty_id !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own notes" });
        }

        await note.destroy();

        return res.json({ message: "Note deleted" });
    } catch (err) {
        console.error("❌ Delete note error:", err);
        return res.status(500).json({ message: "Failed to delete note", error: err.message });
    }
};


