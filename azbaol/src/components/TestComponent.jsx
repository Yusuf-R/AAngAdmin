'use client';

export default function TestComponent({ userData }) {
    return (
        <div className="p-6 bg-green-100 rounded-lg">
            <h1 className="text-2xl font-bold">Test Component Works!</h1>
            <p>Email: {userData.email}</p>
        </div>
    );
}