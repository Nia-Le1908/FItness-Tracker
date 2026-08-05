/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/services/(.*)$": "<rootDir>/services/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/types$": "<rootDir>/types/index",
    "^@/types/(.*)$": "<rootDir>/types/$1",
  },
  transform: {
    "^.+\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        diagnostics: false,
      },
    ],
  },
};

module.exports = config;
