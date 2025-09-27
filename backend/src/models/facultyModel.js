module.exports = (sequelize, Sequelize) => {
    const Faculty = sequelize.define('Faculty', {
        faculty_id: {
            type: Sequelize.STRING(7),
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
        password_hash: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        department: {
            type: Sequelize.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'Faculty',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return Faculty;
};
