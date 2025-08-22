import React from 'react'
import { SafeComponent } from './SafeComponent'

// Placeholder MainLayout component to prevent import errors
const MainLayout: React.FC = () => {
  return (
    <SafeComponent name="MainLayout">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🎨 AI Diagram Creator
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Create beautiful Mermaid diagrams with AI assistance
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Editor Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  📝 Editor
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] border-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <p>Mermaid Code Editor</p>
                      <p className="text-sm">Ready for integration</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  👁️ Preview
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] border-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <p>Diagram Preview</p>
                      <p className="text-sm">Ready for integration</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Features Grid */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">AI Generation</h3>
                <p className="text-sm text-gray-600">Smart diagram creation</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-green-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Live Preview</h3>
                <p className="text-sm text-gray-600">Real-time rendering</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-purple-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Save Views</h3>
                <p className="text-sm text-gray-600">Persistent states</p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-orange-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">Comments</h3>
                <p className="text-sm text-gray-600">Team collaboration</p>
              </div>

            </div>

            {/* Status */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800">
                    Error Boundaries Active
                  </p>
                  <p className="text-sm text-green-600">
                    Application is protected against runtime errors and ready for development
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </SafeComponent>
  )
}

export default MainLayout