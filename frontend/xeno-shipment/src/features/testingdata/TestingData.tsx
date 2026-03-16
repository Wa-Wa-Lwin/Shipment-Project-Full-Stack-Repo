import { useAuth } from '@context/AuthContext'

const TestingData = () => {
  const { user, approver } = useAuth();
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-600">Testing Purpose : These are the approver data for Testing only.</h1>
        <p className="text-gray-600 mt-2">
          Welcome, {user?.firstName} {user?.lastName || user?.username || user?.email}! This is the data for your testing purpose.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Data</h2>
          {user ? (
            <div className="space-y-2">
              <p><span className="font-medium">User ID:</span> {user.userID}</p>
              <p><span className="font-medium">Username:</span> {user.username}</p>
              <p><span className="font-medium">First Name:</span> {user.firstName}</p>
              <p><span className="font-medium">Last Name:</span> {user.lastName}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Phone:</span> {user.phone}</p>
              <p><span className="font-medium">Gender:</span> {user.gender}</p>
              <p><span className="font-medium">Department ID:</span> {user.departmentID}</p>
              <p><span className="font-medium">Position ID:</span> {user.postitionID}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
              <p><span className="font-medium">User Code:</span> {user.user_code}</p>
              <p><span className="font-medium">Supervisor ID:</span> {user.supervisorID}</p>
              <p><span className="font-medium">Level:</span> {user.level}</p>
              <p><span className="font-medium">Section Index:</span> {user.section_index}</p>
              <p><span className="font-medium">Active:</span> {user.active}</p>
              <p><span className="font-medium">Head ID:</span> {user.headID}</p>
              <p><span className="font-medium">Logistic Role :</span> {user.logisticRole}</p>
            </div>
          ) : (
            <p className="text-gray-500">No user data available</p>
          )}
          
          {user && (
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Raw User Data</summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Approver Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Approver Data</h2>
          {approver ? (
            <div className="space-y-2">
              <p><span className="font-medium">User ID:</span> {approver.userID}</p>
              <p><span className="font-medium">Username:</span> {approver.username}</p>
              <p><span className="font-medium">First Name:</span> {approver.firstName}</p>
              <p><span className="font-medium">Last Name:</span> {approver.lastName}</p>
              <p><span className="font-medium">Email:</span> {approver.email}</p>
              <p><span className="font-medium">Phone:</span> {approver.phone}</p>
              <p><span className="font-medium">Gender:</span> {approver.gender}</p>
              <p><span className="font-medium">Department ID:</span> {approver.departmentID}</p>
              <p><span className="font-medium">Position ID:</span> {approver.postitionID}</p>
              <p><span className="font-medium">Role:</span> {approver.role}</p>
              <p><span className="font-medium">User Code:</span> {approver.user_code}</p>
              <p><span className="font-medium">Supervisor ID:</span> {approver.supervisorID}</p>
              <p><span className="font-medium">Level:</span> {approver.level}</p>
              <p><span className="font-medium">Section Index:</span> {approver.section_index}</p>
              <p><span className="font-medium">Active:</span> {approver.active}</p>
              <p><span className="font-medium">Head ID:</span> {approver.headID}</p>
              <p><span className="font-medium">Logistic Role :</span> {approver.logisticRole}</p>
            </div>
          ) : (
            <p className="text-gray-500">No approver data available</p>
          )}
          
          {approver && (
            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Raw Approver Data</summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto">
                {JSON.stringify(approver, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestingData