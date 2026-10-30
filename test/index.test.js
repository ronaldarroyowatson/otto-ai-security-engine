import test from 'node:test';
import assert from 'node:assert/strict';
import { PermissionPolicy, SecurityEngine, OTTO_ENGINE } from '../src/index.js';

test('engine metadata is initialized', () => {
  assert.equal(OTTO_ENGINE.name.startsWith('otto'), true);
  assert.equal(OTTO_ENGINE.sandboxed, true);
  assert.equal(OTTO_ENGINE.auditable, true);
});

test('allowed actions execute and denied actions fail', () => {
  const security = new SecurityEngine();
  security.registerPolicy('agent-a', new PermissionPolicy('agent-a', {
    'filesystem:read': true,
    'filesystem:write': true,
    'git:read': true,
    'node:read': true,
    'tool:install': false
  }, {
    filesystem: ['project/notes.md'],
    git: ['project/.git'],
    node: ['n1']
  }));

  const allowed = security.executeAction({
    actor: 'agent-a',
    action: 'write',
    resourceType: 'filesystem',
    resource: 'project/notes.md',
    requiredPermissions: ['filesystem:write']
  });
  assert.equal(allowed.allowed, true);

  const denied = security.executeAction({
    actor: 'agent-a',
    action: 'install',
    resourceType: 'tool',
    resource: 'dangerous-tool',
    requiredPermissions: ['tool:install']
  });
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /denied/i);
});

test('approval workflow is required and self-approval is denied', () => {
  const security = new SecurityEngine();
  security.registerPolicy('agent-a', new PermissionPolicy('agent-a', {
    'tool:install': true,
    'mcp:register': true,
    'execution:run': true
  }, {
    tool: ['safe-tool'],
    mcp: ['safe-mcp'],
    execution: ['workflow-1']
  }));

  const approvalRequest = security.requestApproval({
    actor: 'agent-a',
    action: 'install',
    resourceType: 'tool',
    resource: 'safe-tool',
    requiredPermissions: ['tool:install']
  });

  assert.equal(approvalRequest.state, 'pending');

  const badSelfApproval = security.approveAction(approvalRequest.id, 'agent-a');
  assert.equal(badSelfApproval.allowed, false);

  const userApproval = security.approveAction(approvalRequest.id, 'user-1');
  assert.equal(userApproval.allowed, true);

  const execution = security.executeAction({
    actor: 'agent-a',
    action: 'install',
    resourceType: 'tool',
    resource: 'safe-tool',
    requiredPermissions: ['tool:install'],
    requiresApproval: true,
    approvalId: approvalRequest.id
  });
  assert.equal(execution.allowed, true);
});

test('self-grant and privilege bypass attempts are rejected', () => {
  const security = new SecurityEngine();
  security.registerPolicy('agent-a', new PermissionPolicy('agent-a', {
    'filesystem:read': true,
    'filesystem:write': false
  }, {
    filesystem: ['project/notes.md']
  }));

  const selfGrant = security.grantPermission('agent-a', 'agent-a', ['filesystem:write']);
  assert.equal(selfGrant.allowed, false);

  const bypass = security.executeAction({
    actor: 'agent-a',
    action: 'write',
    resourceType: 'filesystem',
    resource: '../outside.md',
    requiredPermissions: ['filesystem:write']
  });
  assert.equal(bypass.allowed, false);
  assert.match(bypass.reason, /not allowed|denied/i);
});
