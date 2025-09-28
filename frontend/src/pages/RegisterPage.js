import React, { useState } from 'react';
import { registerUser } from '../services/api'; // Make sure this path is correct

function RegisterPage() {
    // State to hold the form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: 'Test User', // Example of other data
        role: 'student'
    });

    // Function to update state when user types
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh
        try {
            // Call the API function with the form data
            await registerUser(formData);
            alert('Registration successful!');
        } catch (error) {
            alert('Registration failed. See console for details.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Register</h3>
            <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
            />
            <br />
            <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
            />
            <br />
            <button type="submit">Register</button>
        </form>
    );
}

export default RegisterPage;