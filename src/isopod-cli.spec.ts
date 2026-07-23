import { beforeEach, describe, expect, test, vi } from 'vitest';
// '@podman-desktop/api' is aliased to the stub in vite.config.ts test config;
// this import reaches the same module instance isopod-cli sees.
import { process as pdProcess } from './__mocks__/podman-desktop-api';
import * as isopod from './isopod-cli';

const execMock = vi.fn();
pdProcess.exec = execMock;

beforeEach(() => {
  execMock.mockReset();
});

describe('listBoxes', () => {
  test('parses the --json contract', async () => {
    execMock.mockResolvedValue({
      stdout: JSON.stringify([
        {
          name: 'mybox',
          status: 'running',
          ssh_host: 'isopod-mybox',
          port: 4222,
          color: 'teal',
          engine: 'podman',
        },
      ]),
    });
    const boxes = await isopod.listBoxes();
    expect(execMock).toHaveBeenCalledWith('isopod', ['list', '--json']);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].name).toBe('mybox');
    expect(boxes[0].port).toBe(4222);
  });

  test('rejects on non-JSON output', async () => {
    execMock.mockResolvedValue({ stdout: 'NAME  STATUS\n' });
    await expect(isopod.listBoxes()).rejects.toThrow(/not valid JSON/);
  });
});

describe('egressStatus', () => {
  test('parses proxy: null', async () => {
    execMock.mockResolvedValue({
      stdout: JSON.stringify({
        mode: 'lan-deny',
        firewall: 'unknown',
        network: 'isopod0',
        subnet: '10.88.7.0/24',
        dns: '1.1.1.1',
        proxy: null,
      }),
    });
    const status = await isopod.egressStatus();
    expect(execMock).toHaveBeenCalledWith('isopod', ['egress', 'status', '--json']);
    expect(status.proxy).toBeNull();
  });
});

describe('openInIde', () => {
  test('runs isopod code detached', async () => {
    execMock.mockResolvedValue({ stdout: '' });
    await isopod.openInIde('mybox');
    expect(execMock).toHaveBeenCalledWith('isopod', ['code', 'mybox'], { detached: true });
  });
});

describe('tailEgressLog', () => {
  test('splits chunks into lines and stops via cancellation', async () => {
    let resolveExec: (value: { stdout: string; }) => void = () => {};
    execMock.mockImplementation(
      (_cmd: string, _args: string[], options: { logger: { log: (...d: unknown[]) => void; }; }) => {
        options.logger.log('a.example.com allowed\nb.example.com denied\n');
        return new Promise((resolve) => {
          resolveExec = resolve;
        });
      },
    );
    const lines: string[] = [];
    let exited = false;
    const handle = isopod.tailEgressLog(
      (batch) => lines.push(...batch),
      () => {
        exited = true;
      },
    );
    expect(lines).toEqual(['a.example.com allowed', 'b.example.com denied']);
    handle.stop();
    resolveExec({ stdout: '' });
    await new Promise((resolve) => setImmediate(resolve));
    expect(exited).toBe(true);
  });
});

describe('boxNameFromContainer', () => {
  test('reads the io.isopod.box label', () => {
    expect(isopod.boxNameFromContainer({ Labels: { 'io.isopod.box': 'mybox' } })).toBe('mybox');
    expect(isopod.boxNameFromContainer({ Labels: {} })).toBeUndefined();
    expect(isopod.boxNameFromContainer({})).toBeUndefined();
  });
});
