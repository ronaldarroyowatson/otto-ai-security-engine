const deepClone = (value) => JSON.parse(JSON.stringify(value));

export class PermissionPolicy {
  constructor(subject, permissions = {}, allowedResources = {}) {
    this.subject = subject;
    this.permissions = { ...permissions };
    this.allowedResources = deepClone(allowedResources);
  }
}

export class SecurityEngine {
  constructor() {
    this.policies = new Map();
    this.approvalQueue = new Map();
    this.auditLog = [];
  }

  registerPolicy(subject, policy) {
    this.policies.set(subject, policy instanceof PermissionPolicy ? policy : new PermissionPolicy(subject, policy.permissions ?? {}, policy.allowedResources ?? {}));
    return this.policies.get(subject);
  }

  getPolicy(subject) {
    return this.policies.get(subject);
  }

  requestApproval(action) {
    const request = {
      id: `approval-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      actor: action.actor,
      action: action.action,
      resourceType: action.resourceType,
      resource: action.resource,
      requiredPermissions: Array.isArray(action.requiredPermissions) ? [...action.requiredPermissions] : [],
      state: 'pending',
      createdAt: new Date().toISOString()
    };
    this.approvalQueue.set(request.id, request);
    return request;
  }

  approveAction(requestId, approver) {
    const request = this.approvalQueue.get(requestId);
    if (!request) {
      return { allowed: false, reason: `Unknown approval request '${requestId}'.` };
    }
    if (request.actor === approver) {
      return { allowed: false, reason: 'Self-approval is denied.' };
    }
    if (request.state !== 'pending') {
      return { allowed: false, reason: `Approval request is already ${request.state}.` };
    }

    request.state = 'approved';
    request.approvedBy = approver;
    request.approvedAt = new Date().toISOString();
    this.auditLog.push({ type: 'approval', requestId: request.id, approvedBy: approver, approvedAt: request.approvedAt });
    return { allowed: true, request };
  }

  grantPermission(subject, grantee, permissions) {
    if (subject === grantee) {
      return { allowed: false, reason: 'Self-grant is denied.' };
    }

    const policy = this.policies.get(grantee) ?? new PermissionPolicy(grantee);
    for (const permission of Array.isArray(permissions) ? permissions : []) {
      policy.permissions[permission] = true;
    }
    this.policies.set(grantee, policy);
    return { allowed: true, subject: grantee, permissions: [...(Array.isArray(permissions) ? permissions : [])] };
  }

  executeAction(action) {
    const policy = this.policies.get(action.actor);
    if (!policy) {
      return { allowed: false, reason: `No policy registered for actor '${action.actor}'.` };
    }

    const requiredPermissions = Array.isArray(action.requiredPermissions) ? action.requiredPermissions : [];
    for (const requiredPermission of requiredPermissions) {
      const permissionAllowed = policy.permissions[requiredPermission] === true;
      if (!permissionAllowed) {
        return { allowed: false, reason: `Permission '${requiredPermission}' is denied for '${action.actor}'.` };
      }
    }

    if (action.resourceType) {
      const allowedResources = policy.allowedResources[action.resourceType] ?? [];
      if (Array.isArray(allowedResources) && allowedResources.length > 0 && !allowedResources.includes(action.resource)) {
        return { allowed: false, reason: `Resource '${action.resource}' is not allowed for '${action.resourceType}'.` };
      }
    }

    if (action.requiresApproval) {
      const approvalRequest = this.approvalQueue.get(action.approvalId ?? '');
      if (!approvalRequest || approvalRequest.state !== 'approved') {
        return { allowed: false, reason: 'Approval required before execution.' };
      }
      if (approvalRequest.actor !== action.actor || approvalRequest.action !== action.action || approvalRequest.resource !== action.resource) {
        return { allowed: false, reason: 'Approval does not match the requested action.' };
      }
    }

    const auditEntry = {
      actor: action.actor,
      action: action.action,
      resourceType: action.resourceType,
      resource: action.resource,
      allowed: true,
      executedAt: new Date().toISOString()
    };
    this.auditLog.push(auditEntry);
    return { allowed: true, auditEntry };
  }
}

export const OTTO_ENGINE = {
  name: 'otto-ai-security-engine',
  version: '0.1.0',
  sandboxed: true,
  auditable: true,
  recoverable: true
};
