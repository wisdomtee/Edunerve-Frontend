"use client"

import { useEffect, useState } from "react"

type ClassItem = {
  id: number
  name: string
}

type Student = {
  id: number
  name: string
  email: string
  class: {
    name: string
  }
}

export default function AdminSchoolPage() {
  const [className, setClassName] =
    useState("")

  const [classes, setClasses] = useState<
    ClassItem[]
  >([])

  const [students, setStudents] = useState<
    Student[]
  >([])

  const [studentName, setStudentName] =
    useState("")

  const [studentEmail, setStudentEmail] =
    useState("")

  const [studentPassword, setStudentPassword] =
    useState("")

  const [selectedClass, setSelectedClass] =
    useState("")

  const fetchClasses = async () => {
    const res = await fetch(
      "http://localhost:5000/classes"
    )

    const data = await res.json()

    setClasses(data)
  }

  const fetchStudents = async () => {
    const res = await fetch(
      "http://localhost:5000/students"
    )

    const data = await res.json()

    setStudents(data)
  }

  useEffect(() => {
    fetchClasses()
    fetchStudents()
  }, [])

  const handleCreateClass = async () => {
    if (!className) {
      alert("Enter class name")
      return
    }

    await fetch("http://localhost:5000/classes", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        name: className,
      }),
    })

    setClassName("")

    fetchClasses()
  }

  const handleCreateStudent = async () => {
    if (
      !studentName ||
      !studentEmail ||
      !studentPassword ||
      !selectedClass
    ) {
      alert("Fill all fields")
      return
    }

    const res = await fetch(
      "http://localhost:5000/students",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: studentName,
          email: studentEmail,
          password: studentPassword,
          classId: selectedClass,
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      alert(data.message)
      return
    }

    alert("Student created")

    setStudentName("")
    setStudentEmail("")
    setStudentPassword("")
    setSelectedClass("")

    fetchStudents()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <h1 className="text-3xl font-bold mb-8">
        School Management
      </h1>

      {/* CREATE CLASS */}
      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Create Class
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Class Name"
            value={className}
            onChange={(e) =>
              setClassName(e.target.value)
            }
            className="border p-2 rounded w-full"
          />

          <button
            onClick={handleCreateClass}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Create
          </button>
        </div>
      </div>

      {/* CREATE STUDENT */}
      <div className="border rounded p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Create Student
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Student Name"
            value={studentName}
            onChange={(e) =>
              setStudentName(e.target.value)
            }
            className="border p-2 rounded"
          />

          <input
            type="email"
            placeholder="Email"
            value={studentEmail}
            onChange={(e) =>
              setStudentEmail(e.target.value)
            }
            className="border p-2 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={studentPassword}
            onChange={(e) =>
              setStudentPassword(e.target.value)
            }
            className="border p-2 rounded"
          />

          <select
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(e.target.value)
            }
            className="border p-2 rounded"
          >
            <option value="">
              Select Class
            </option>

            {classes.map((cls) => (
              <option
                key={cls.id}
                value={cls.id}
              >
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateStudent}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Create Student
        </button>
      </div>

      {/* STUDENTS LIST */}
      <div className="border rounded p-4">
        <h2 className="text-xl font-bold mb-4">
          Students
        </h2>

        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="border rounded p-3"
            >
              <h3 className="font-semibold">
                {student.name}
              </h3>

              <p>{student.email}</p>

              <p className="text-sm text-gray-500">
                Class: {student.class?.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}