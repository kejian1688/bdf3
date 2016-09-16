package com.bstek.bdf3.security.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.ConfigAttribute;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bstek.bdf3.jpa.JpaUtil;
import com.bstek.bdf3.security.domain.Component;
import com.bstek.bdf3.security.domain.Permission;

/**
 * @author Kevin Yang (mailto:kevin.yang@bstek.com)
 * @since 2016年1月30日
 */
@Service
@Transactional(readOnly = true)
public class ComponentServiceImpl implements ComponentService {

	@Override
	public List<Component> findAll() {
		List<Component> components = JpaUtil.linq(Component.class).findAll();
		List<Permission> permissions = JpaUtil.linq(Permission.class).equal("resourceType", Component.RESOURCE_TYPE).findAll();
		if (!permissions.isEmpty()) {
			Map<String, Component> componentMap = JpaUtil.index(components);
			for (Permission permission : permissions) {
				Component component = componentMap.get(permission.getResourceId());
				List<ConfigAttribute> configAttributes = component.getAttributes();
				if (configAttributes == null) {
					configAttributes = new ArrayList<ConfigAttribute>();
					component.setAttributes(configAttributes);
				}
				configAttributes.add(permission);
			}
		}
		return components;

	}

}
