import { gql } from 'apollo-server-express';

export const codeExecutionTypeDefs = gql`
  type ExecutionStatus {
    id: Int!
    description: String!
  }

  type ExecutionResult {
    stdout: String
    stderr: String
    compile_output: String
    status: ExecutionStatus!
    time: String
    memory: Int
  }

  input ExecuteCodeInput {
    sourceCode: String!
    languageId: Int
    stdin: String
  }

  extend type Mutation {
    executeCode(input: ExecuteCodeInput!): ExecutionResult!
  }
`;