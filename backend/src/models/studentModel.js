module.exports = (sequelize, Sequelize) => {
    const Student = sequelize.define('Student', {
        student_id: {
            type: Sequelize.STRING(8),
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        email: {
            type: Sequelize.STRING(100),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        program: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        password_hash: {
            type: Sequelize.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'Students',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Student;
};