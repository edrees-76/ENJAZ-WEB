import { describe, it, expect } from 'vitest';
import { Permission, hasPermission } from '../store/useAuthStore';

describe('Permission System', () => {
  describe('Permission constants', () => {
    it('SampleReceptions = 1 (bit 0)', () => {
      expect(Permission.SampleReceptions).toBe(1);
    });

    it('Certificates = 2 (bit 1)', () => {
      expect(Permission.Certificates).toBe(2);
    });

    it('Reports = 4 (bit 2)', () => {
      expect(Permission.Reports).toBe(4);
    });

    it('Settings = 8 (bit 3)', () => {
      expect(Permission.Settings).toBe(8);
    });

    it('AdminProcedures = 16 (bit 4)', () => {
      expect(Permission.AdminProcedures).toBe(16);
    });

    it('Users = 32 (bit 5)', () => {
      expect(Permission.Users).toBe(32);
    });

    it('All = 63 (all bits set)', () => {
      expect(Permission.All).toBe(63);
    });
  });

  describe('hasPermission', () => {
    it('returns true when user has exact permission', () => {
      expect(hasPermission(Permission.Certificates, Permission.Certificates)).toBe(true);
    });

    it('returns false when user lacks permission', () => {
      expect(hasPermission(Permission.SampleReceptions, Permission.Certificates)).toBe(false);
    });

    it('All permissions includes every individual permission', () => {
      expect(hasPermission(Permission.All, Permission.SampleReceptions)).toBe(true);
      expect(hasPermission(Permission.All, Permission.Certificates)).toBe(true);
      expect(hasPermission(Permission.All, Permission.Reports)).toBe(true);
      expect(hasPermission(Permission.All, Permission.Settings)).toBe(true);
      expect(hasPermission(Permission.All, Permission.AdminProcedures)).toBe(true);
      expect(hasPermission(Permission.All, Permission.Users)).toBe(true);
    });

    it('combined permissions work correctly', () => {
      const combined = Permission.SampleReceptions | Permission.Certificates; // 3
      expect(hasPermission(combined, Permission.SampleReceptions)).toBe(true);
      expect(hasPermission(combined, Permission.Certificates)).toBe(true);
      expect(hasPermission(combined, Permission.Reports)).toBe(false);
    });

    it('zero permissions has nothing', () => {
      expect(hasPermission(0, Permission.SampleReceptions)).toBe(false);
    });
  });
});
