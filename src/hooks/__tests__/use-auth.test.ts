import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);
});

describe("useAuth", () => {
  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    it("calls signInAction with email and password", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockSignInAction).toHaveBeenCalledWith("user@test.com", "password123");
    });

    it("sets isLoading to true during sign in and resets after", async () => {
      let resolveSignIn!: (value: any) => void;
      mockSignInAction.mockReturnValue(new Promise((r) => (resolveSignIn = r)));
      mockGetProjects.mockResolvedValue([{ id: "p1" }] as any);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("user@test.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: true });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("resets isLoading to false on failure", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "wrongpassword");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("resets isLoading to false when signInAction throws", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("returns the result from signInAction", async () => {
      const expected = { success: false, error: "Invalid credentials" };
      mockSignInAction.mockResolvedValue(expected);
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@test.com", "wrongpassword");
      });

      expect(returnValue).toEqual(expected);
    });

    it("does not call handlePostSignIn when sign in fails", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "wrongpassword");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("signUp", () => {
    it("calls signUpAction with email and password", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@test.com", "password123");
      });

      expect(mockSignUpAction).toHaveBeenCalledWith("new@test.com", "password123");
    });

    it("sets isLoading to true during sign up and resets after", async () => {
      let resolveSignUp!: (value: any) => void;
      mockSignUpAction.mockReturnValue(new Promise((r) => (resolveSignUp = r)));
      mockGetProjects.mockResolvedValue([]);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@test.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: true });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("resets isLoading to false on failure", async () => {
      mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("existing@test.com", "password123");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("resets isLoading to false when signUpAction throws", async () => {
      mockSignUpAction.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@test.com", "password123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("returns the result from signUpAction", async () => {
      const expected = { success: false, error: "Email already registered" };
      mockSignUpAction.mockResolvedValue(expected);
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("existing@test.com", "password123");
      });

      expect(returnValue).toEqual(expected);
    });

    it("does not call handlePostSignIn when sign up fails", async () => {
      mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("existing@test.com", "password123");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — anonymous work exists", () => {
    const anonWork = {
      messages: [{ role: "user", content: "Build a button" }],
      fileSystemData: { "/": { type: "directory" }, "/App.jsx": { type: "file", content: "" } },
    };

    beforeEach(() => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);
    });

    it("creates a project with the anonymous work", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from /),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
    });

    it("clears anonymous work after creating the project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockClearAnonWork).toHaveBeenCalled();
    });

    it("navigates to the new project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
    });

    it("does not call getProjects when anonymous work exists", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockGetProjects).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — no anonymous work, existing projects", () => {
    beforeEach(() => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: "recent-project", name: "My Design" },
        { id: "older-project", name: "Old Design" },
      ] as any);
    });

    it("navigates to the most recent project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-project");
    });

    it("does not create a new project when projects exist", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — no anonymous work, no existing projects", () => {
    beforeEach(() => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "brand-new-project" } as any);
    });

    it("creates a new project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
    });

    it("navigates to the newly created project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });
  });

  describe("handlePostSignIn — anonymous work exists but has no messages", () => {
    beforeEach(() => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([{ id: "existing-project" }] as any);
    });

    it("falls through to getProjects when anon work has no messages", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@test.com", "password123");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });
  });

  describe("postSignIn triggered by signUp success", () => {
    it("creates an anon project after successful sign up", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Make a form" }],
        fileSystemData: { "/": {} },
      };
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "signup-anon-project" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@test.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: anonWork.messages })
      );
      expect(mockPush).toHaveBeenCalledWith("/signup-anon-project");
    });
  });
});
