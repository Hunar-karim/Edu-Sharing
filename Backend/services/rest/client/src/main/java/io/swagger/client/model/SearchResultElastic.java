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
import io.swagger.client.model.Facette;
import io.swagger.client.model.Pagination;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * SearchResultElastic
 */
@javax.annotation.Generated(value = "io.swagger.codegen.languages.JavaClientCodegen", date = "2021-06-09T17:32:21.273+02:00")
public class SearchResultElastic {
  @SerializedName("elasticResponse")
  private String elasticResponse = null;

  @SerializedName("nodes")
  private List<Object> nodes = new ArrayList<Object>();

  @SerializedName("pagination")
  private Pagination pagination = null;

  @SerializedName("facettes")
  private List<Facette> facettes = new ArrayList<Facette>();

  @SerializedName("ignored")
  private List<String> ignored = null;

  public SearchResultElastic elasticResponse(String elasticResponse) {
    this.elasticResponse = elasticResponse;
    return this;
  }

   /**
   * Get elasticResponse
   * @return elasticResponse
  **/
  @ApiModelProperty(value = "")
  public String getElasticResponse() {
    return elasticResponse;
  }

  public void setElasticResponse(String elasticResponse) {
    this.elasticResponse = elasticResponse;
  }

  public SearchResultElastic nodes(List<Object> nodes) {
    this.nodes = nodes;
    return this;
  }

  public SearchResultElastic addNodesItem(Object nodesItem) {
    this.nodes.add(nodesItem);
    return this;
  }

   /**
   * Get nodes
   * @return nodes
  **/
  @ApiModelProperty(required = true, value = "")
  public List<Object> getNodes() {
    return nodes;
  }

  public void setNodes(List<Object> nodes) {
    this.nodes = nodes;
  }

  public SearchResultElastic pagination(Pagination pagination) {
    this.pagination = pagination;
    return this;
  }

   /**
   * Get pagination
   * @return pagination
  **/
  @ApiModelProperty(required = true, value = "")
  public Pagination getPagination() {
    return pagination;
  }

  public void setPagination(Pagination pagination) {
    this.pagination = pagination;
  }

  public SearchResultElastic facettes(List<Facette> facettes) {
    this.facettes = facettes;
    return this;
  }

  public SearchResultElastic addFacettesItem(Facette facettesItem) {
    this.facettes.add(facettesItem);
    return this;
  }

   /**
   * Get facettes
   * @return facettes
  **/
  @ApiModelProperty(required = true, value = "")
  public List<Facette> getFacettes() {
    return facettes;
  }

  public void setFacettes(List<Facette> facettes) {
    this.facettes = facettes;
  }

  public SearchResultElastic ignored(List<String> ignored) {
    this.ignored = ignored;
    return this;
  }

  public SearchResultElastic addIgnoredItem(String ignoredItem) {
    if (this.ignored == null) {
      this.ignored = new ArrayList<String>();
    }
    this.ignored.add(ignoredItem);
    return this;
  }

   /**
   * Get ignored
   * @return ignored
  **/
  @ApiModelProperty(value = "")
  public List<String> getIgnored() {
    return ignored;
  }

  public void setIgnored(List<String> ignored) {
    this.ignored = ignored;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    SearchResultElastic searchResultElastic = (SearchResultElastic) o;
    return Objects.equals(this.elasticResponse, searchResultElastic.elasticResponse) &&
        Objects.equals(this.nodes, searchResultElastic.nodes) &&
        Objects.equals(this.pagination, searchResultElastic.pagination) &&
        Objects.equals(this.facettes, searchResultElastic.facettes) &&
        Objects.equals(this.ignored, searchResultElastic.ignored);
  }

  @Override
  public int hashCode() {
    return Objects.hash(elasticResponse, nodes, pagination, facettes, ignored);
  }


  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class SearchResultElastic {\n");
    
    sb.append("    elasticResponse: ").append(toIndentedString(elasticResponse)).append("\n");
    sb.append("    nodes: ").append(toIndentedString(nodes)).append("\n");
    sb.append("    pagination: ").append(toIndentedString(pagination)).append("\n");
    sb.append("    facettes: ").append(toIndentedString(facettes)).append("\n");
    sb.append("    ignored: ").append(toIndentedString(ignored)).append("\n");
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
