package org.edu_sharing.repository.server.jobs.quartz;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.policy.BehaviourFilter;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.transaction.RetryingTransactionHelper.RetryingTransactionCallback;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.security.PermissionService;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.transaction.TransactionService;
import org.apache.log4j.Logger;
import org.edu_sharing.alfrescocontext.gate.AlfAppContextGate;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.context.ApplicationContext;

public class FixScopeForNodeJob extends AbstractJob {

	public static String PARAM_NODEID = "NODEID";

	public static String PARAM_EXECUTE = "EXECUTE";

	ApplicationContext applicationContext = AlfAppContextGate.getApplicationContext();

	ServiceRegistry serviceRegistry = (ServiceRegistry) applicationContext.getBean(ServiceRegistry.SERVICE_REGISTRY);

	NodeService nodeService = serviceRegistry.getNodeService();

	PermissionService permissionService = serviceRegistry.getPermissionService();

	BehaviourFilter policyBehaviourFilter = (BehaviourFilter) applicationContext.getBean("policyBehaviourFilter");

	TransactionService transactionService = serviceRegistry.getTransactionService();

	Logger logger = Logger.getLogger(FixScopeForNodeJob.class);

	QName aspectEduScope = QName.createQName(CCConstants.CCM_ASPECT_EDUSCOPE);

	QName propertyEduScopeName = QName.createQName(CCConstants.CCM_PROP_EDUSCOPE_NAME);

	@Override
	public void execute(JobExecutionContext context) throws JobExecutionException {

		String nodeId = (String) context.getJobDetail().getJobDataMap().get(PARAM_NODEID);
		boolean execute = new Boolean((String) context.getJobDetail().getJobDataMap().get(PARAM_EXECUTE));

		AuthenticationUtil.RunAsWork<Void> runAs = new AuthenticationUtil.RunAsWork<Void>() {
			@Override
			public Void doWork() throws Exception {
				execute(nodeId, execute);
				return null;
			}
		};
		AuthenticationUtil.runAsSystem(runAs);
	}

	private void execute(String nodeId, boolean execute) {
		if (nodeId == null) {
			logger.error("no node id provided");
			return;
		}

		NodeRef nodeRef = new NodeRef(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, nodeId);
		if (!nodeService.exists(nodeRef)) {
			logger.error("nodeId:" + nodeId + " does not exist");
			return;
		}

		String path = nodeService.getPath(nodeRef).toDisplayPath(nodeService, permissionService);
		String name = (String) nodeService.getProperty(nodeRef, ContentModel.PROP_NAME);
		logger.info("path:" + path + " name:" + name);

		transactionService.getRetryingTransactionHelper().doInTransaction(new RetryingTransactionCallback<Void>() {
			@Override
			public Void execute() throws Throwable {
				NodeRef nodeRef = new NodeRef(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, nodeId);
				try {
					policyBehaviourFilter.disableBehaviour(nodeRef);

					if (!nodeService.hasAspect(nodeRef, aspectEduScope)) {
						logger.info(nodeRef + " n:" + name + " does not have Aspect:" + CCConstants.CCM_ASPECT_EDUSCOPE
								+ ". will add it");
						if (execute) {
							Map<QName, Serializable> props = new HashMap<>();
							props.put(propertyEduScopeName, CCConstants.CCM_VALUE_SCOPE_SAFE);
							nodeService.addAspect(nodeRef, aspectEduScope, props);
						}
					} else {
						logger.info("aspect " + aspectEduScope + " is already set");
					}

					String scope = (String) nodeService.getProperty(nodeRef,
							QName.createQName(CCConstants.CCM_PROP_EDUSCOPE_NAME));
					if (scope == null || scope.trim().equals("")) {
						logger.info(nodeRef + " n:" + name + " does not have the scope property. will set it");
						if (execute) {
							nodeService.setProperty(nodeRef, propertyEduScopeName, CCConstants.CCM_VALUE_SCOPE_SAFE);
						}
					} else {
						logger.info("found scope " + scope + " for " + nodeRef);
					}

				} finally {
					policyBehaviourFilter.enableBehaviour(nodeRef);
				}
				return null;
			}
		});

		QName type = nodeService.getType(nodeRef);
		if (QName.createQName(CCConstants.CCM_TYPE_MAP).equals(type) || ContentModel.TYPE_FOLDER.equals(type)) {
			for (ChildAssociationRef childAssoc : nodeService.getChildAssocs(nodeRef)) {
				execute(childAssoc.getChildRef().getId(), execute);
			}
		}
	}

	@Override
	public Class[] getJobClasses() {
		return allJobs;
	}

}
