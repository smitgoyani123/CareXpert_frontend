import { useState } from "react";

export function SampleCredentials() {
  const [isVisible, _setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div >
      {/* <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Demo Credentials
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Use these credentials to explore the platform:
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-blue-700 dark:text-blue-300">
                <span className="font-medium">Patient:</span> patient@demo.com /
                demo123
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                <span className="font-medium">Doctor:</span> doctor@demo.com /
                demo123
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                <span className="font-medium">Admin:</span> admin@demo.com /
                demo123
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-blue-600 dark:text-blue-400"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div> */}  
    </div>
  );
}
