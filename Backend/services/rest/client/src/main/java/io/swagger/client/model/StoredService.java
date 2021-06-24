/*
 * edu-sharing Repository REST API
 * The public restful API of the edu-sharing repository.
 *
 * OpenAPI spec version: 1.1
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


package io.swagger.client.model;

import java.util.Objects;
import java.util.Arrays;
import com.google.gson.TypeAdapter;
import com.google.gson.annotations.JsonAdapter;
import com.google.gson.annotations.SerializedName;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.client.model.Audience;
import io.swagger.client.model.ModelInterface;
import io.swagger.client.model.Provider;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * StoredService
 */
@javax.annotation.Generated(value = "io.swagger.codegen.languages.JavaClientCodegen", date = "2021-06-09T17:32:21.273+02:00")
public class StoredService {
  @SerializedName("name")
  private String name = null;

  @SerializedName("url")
  private String url = null;

  @SerializedName("icon")
  private String icon = null;

  @SerializedName("logo")
  private String logo = null;

  @SerializedName("inLanguage")
  private String inLanguage = null;

  @SerializedName("type")
  private String type = null;

  @SerializedName("description")
  private String description = null;

  @SerializedName("audience")
  private List<Audience> audience = null;

  @SerializedName("provider")
  private Provider provider = null;

  @SerializedName("startDate")
  private String startDate = null;

  @SerializedName("interfaces")
  private List<ModelInterface> interfaces = null;

  @SerializedName("about")
  private List<String> about = null;

  @SerializedName("id")
  private String id = null;

  @SerializedName("isAccessibleForFree")
  private Boolean isAccessibleForFree = false;

  public StoredService name(String name) {
    this.name = name;
    return this;
  }

   /**
   * Get name
   * @return name
  **/
  @ApiModelProperty(value = "")
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public StoredService url(String url) {
    this.url = url;
    return this;
  }

   /**
   * Get url
   * @return url
  **/
  @ApiModelProperty(value = "")
  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public StoredService icon(String icon) {
    this.icon = icon;
    return this;
  }

   /**
   * Get icon
   * @return icon
  **/
  @ApiModelProperty(value = "")
  public String getIcon() {
    return icon;
  }

  public void setIcon(String icon) {
    this.icon = icon;
  }

  public StoredService logo(String logo) {
    this.logo = logo;
    return this;
  }

   /**
   * Get logo
   * @return logo
  **/
  @ApiModelProperty(value = "")
  public String getLogo() {
    return logo;
  }

  public void setLogo(String logo) {
    this.logo = logo;
  }

  public StoredService inLanguage(String inLanguage) {
    this.inLanguage = inLanguage;
    return this;
  }

   /**
   * Get inLanguage
   * @return inLanguage
  **/
  @ApiModelProperty(value = "")
  public String getInLanguage() {
    return inLanguage;
  }

  public void setInLanguage(String inLanguage) {
    this.inLanguage = inLanguage;
  }

  public StoredService type(String type) {
    this.type = type;
    return this;
  }

   /**
   * Get type
   * @return type
  **/
  @ApiModelProperty(value = "")
  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public StoredService description(String description) {
    this.description = description;
    return this;
  }

   /**
   * Get description
   * @return description
  **/
  @ApiModelProperty(value = "")
  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public StoredService audience(List<Audience> audience) {
    this.audience = audience;
    return this;
  }

  public StoredService addAudienceItem(Audience audienceItem) {
    if (this.audience == null) {
      this.audience = new ArrayList<Audience>();
    }
    this.audience.add(audienceItem);
    return this;
  }

   /**
   * Get audience
   * @return audience
  **/
  @ApiModelProperty(value = "")
  public List<Audience> getAudience() {
    return audience;
  }

  public void setAudience(List<Audience> audience) {
    this.audience = audience;
  }

  public StoredService provider(Provider provider) {
    this.provider = provider;
    return this;
  }

   /**
   * Get provider
   * @return provider
  **/
  @ApiModelProperty(value = "")
  public Provider getProvider() {
    return provider;
  }

  public void setProvider(Provider provider) {
    this.provider = provider;
  }

  public StoredService startDate(String startDate) {
    this.startDate = startDate;
    return this;
  }

   /**
   * Get startDate
   * @return startDate
  **/
  @ApiModelProperty(value = "")
  public String getStartDate() {
    return startDate;
  }

  public void setStartDate(String startDate) {
    this.startDate = startDate;
  }

  public StoredService interfaces(List<ModelInterface> interfaces) {
    this.interfaces = interfaces;
    return this;
  }

  public StoredService addInterfacesItem(ModelInterface interfacesItem) {
    if (this.interfaces == null) {
      this.interfaces = new ArrayList<ModelInterface>();
    }
    this.interfaces.add(interfacesItem);
    return this;
  }

   /**
   * Get interfaces
   * @return interfaces
  **/
  @ApiModelProperty(value = "")
  public List<ModelInterface> getInterfaces() {
    return interfaces;
  }

  public void setInterfaces(List<ModelInterface> interfaces) {
    this.interfaces = interfaces;
  }

  public StoredService about(List<String> about) {
    this.about = about;
    return this;
  }

  public StoredService addAboutItem(String aboutItem) {
    if (this.about == null) {
      this.about = new ArrayList<String>();
    }
    this.about.add(aboutItem);
    return this;
  }

   /**
   * Get about
   * @return about
  **/
  @ApiModelProperty(value = "")
  public List<String> getAbout() {
    return about;
  }

  public void setAbout(List<String> about) {
    this.about = about;
  }

  public StoredService id(String id) {
    this.id = id;
    return this;
  }

   /**
   * Get id
   * @return id
  **/
  @ApiModelProperty(value = "")
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public StoredService isAccessibleForFree(Boolean isAccessibleForFree) {
    this.isAccessibleForFree = isAccessibleForFree;
    return this;
  }

   /**
   * Get isAccessibleForFree
   * @return isAccessibleForFree
  **/
  @ApiModelProperty(value = "")
  public Boolean isIsAccessibleForFree() {
    return isAccessibleForFree;
  }

  public void setIsAccessibleForFree(Boolean isAccessibleForFree) {
    this.isAccessibleForFree = isAccessibleForFree;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    StoredService storedService = (StoredService) o;
    return Objects.equals(this.name, storedService.name) &&
        Objects.equals(this.url, storedService.url) &&
        Objects.equals(this.icon, storedService.icon) &&
        Objects.equals(this.logo, storedService.logo) &&
        Objects.equals(this.inLanguage, storedService.inLanguage) &&
        Objects.equals(this.type, storedService.type) &&
        Objects.equals(this.description, storedService.description) &&
        Objects.equals(this.audience, storedService.audience) &&
        Objects.equals(this.provider, storedService.provider) &&
        Objects.equals(this.startDate, storedService.startDate) &&
        Objects.equals(this.interfaces, storedService.interfaces) &&
        Objects.equals(this.about, storedService.about) &&
        Objects.equals(this.id, storedService.id) &&
        Objects.equals(this.isAccessibleForFree, storedService.isAccessibleForFree);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, url, icon, logo, inLanguage, type, description, audience, provider, startDate, interfaces, about, id, isAccessibleForFree);
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class StoredService {\n");
    
    sb.append("    name: ").append(toIndentedString(name)).append("\n");
    sb.append("    url: ").append(toIndentedString(url)).append("\n");
    sb.append("    icon: ").append(toIndentedString(icon)).append("\n");
    sb.append("    logo: ").append(toIndentedString(logo)).append("\n");
    sb.append("    inLanguage: ").append(toIndentedString(inLanguage)).append("\n");
    sb.append("    type: ").append(toIndentedString(type)).append("\n");
    sb.append("    description: ").append(toIndentedString(description)).append("\n");
    sb.append("    audience: ").append(toIndentedString(audience)).append("\n");
    sb.append("    provider: ").append(toIndentedString(provider)).append("\n");
    sb.append("    startDate: ").append(toIndentedString(startDate)).append("\n");
    sb.append("    interfaces: ").append(toIndentedString(interfaces)).append("\n");
    sb.append("    about: ").append(toIndentedString(about)).append("\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    isAccessibleForFree: ").append(toIndentedString(isAccessibleForFree)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }

}
